"use strict";


const moduleName = 'chat-listeners:telegram:on-text';


module.exports = {


  friendlyName: 'On text message',


  description: 'Manage text Telegram messages',


  inputs: {

  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: 'Error',
    }

  },


  fn: async function (inputs, exits) {

    sails.log.info('******************** telegramListener.onText ********************');

    sails.config.custom.telegramBot.on('text', async (msg) => {

      let getClientResponse = null;
      let getServiceRes = null;
      let funnels = null;
      let parseRefResult = null;
      let parseServiceResult = null;
      let parseCategoryResult = null;
      let useRefKey = null;
      let useServiceRefKey = '';
      let useCategoryRefKey = '';
      let getLangRes;
      let useLang;
      let params = {};
      let getServiceRefResRaw = null;
      let getCategoryRefResRaw = null;
      let serviceName = null;
      let categoryName = 'user';
      let client;


      try {

        /**
         * Try to get the client record from DB
         */

        getClientResponse = await sails.helpers.storage.clientGet.with({
          messenger: sails.config.custom.enums.messenger.TELEGRAM,
          msg: msg
        });

        // sails.log.warn('!!!!!!!!!!!!!!!!!!!! on-message, clientGet result:', getClientResponse);

        if (getClientResponse.status === 'not_found') {

          /**
           * Client record was not found => create new client record
           */

          if (_.trim(msg.text).match(/\/start/i)) {

            /**
             * If we got start command - try to parse it and get referral key (ref),
             * service reference key (srf) and category key (cat)
             */

            parseRefResult = _.trim(msg.text).match(/ref(\S{31})/);
            parseServiceResult = _.trim(msg.text).match(/srf(\S{7})/);
            parseCategoryResult = _.trim(msg.text).match(/cat(\S{7})/);

          }

          // TODO: Добавить ниже проверку валидности полученных ключей

          if (parseRefResult) {

            // useIsRef = true;
            useRefKey = parseRefResult[1];

          }

          if (parseServiceResult) {

            useServiceRefKey = parseServiceResult[1];

          }

          if (parseCategoryResult) {

            useCategoryRefKey = parseServiceResult[1];

          }

          /**
           * Try to get user preferred language from received message
           */

          getLangRes = await sails.helpers.chatListeners.telegram.getUserLang(msg);
          useLang = getLangRes.payload.lang;

          params = {
            messenger: sails.config.custom.enums.messenger.TELEGRAM,
            chat_id: msg.chat.id,
            first_name: msg.chat.first_name || '',
            last_name: msg.chat.last_name || '',
            username: msg.chat.username,
            lang: useLang,
            ref_key: useRefKey,
          };


          /**
           * Get info about service level
           */


          if (useServiceRefKey) {

            /**
             * Client has service reference key - we need to get service name and
             * set flag the this service reference key is used
             */

            getServiceRefResRaw = await sails.helpers.storage.getServiceRef.with({serviceKey: useServiceRefKey});

            // sails.log.info('getServiceRefResRaw: ', getServiceRefResRaw);

            serviceName = getServiceRefResRaw.payload.service;
          }

          if (serviceName) {

            /**
             * Get info about the respective service
             */

            getServiceRes = await sails.helpers.storage.getService.with({serviceName: serviceName});
            params.service_id = getServiceRes.payload.id;

          }


          /**
           * Get info about client's category
           */

          if (useCategoryRefKey) {

            /**
             * Client has category reference key - we need to get category
             * and save it at client's profile
             */

            getCategoryRefResRaw = await sails.helpers.storage.getCategoryRef.with({categoryKey: useCategoryRefKey});

            // sails.log.info('getCategoryRefResRaw: ', getCategoryRefResRaw);

            categoryName = getCategoryRefResRaw.payload.category;
          }

          params.category = categoryName;


          /**
           * Use info about funnel (from Service table) and load it from Funnels table
           */

          params.current_funnel = getServiceRes.payload.funnel_start;
          params.funnel_name = getServiceRes.payload.funnel_name;

          funnels = await Funnels.findOne({
            name: getServiceRes.payload.funnel_name,
            active: true
          });

          params.funnels = funnels.funnel_data || null;

          getClientResponse = await sails.helpers.storage.clientCreate.with({
            client: params,
            createdBy: moduleName,
          });

        }

        /**
         * Client record was found - proceed based on client record info
         */

        client = getClientResponse.payload;

        /**
         * Отрабытываем, если были вызваны зарегистрированные команды
         */

        if (_.trim(msg.text).match(/^\/main$/i)) {

          const currentAccount = _.find(client.accounts, {guid: client.account_use});

          if (currentAccount.service_subscription_finalized) {

            /**
             * Если клиент находится в клавиатуре повторной проверки подписки
             * на список реферальных профилей, то он должен завершить подписку
             * прежде чем выходить в другие клавиатуры
             */

            if (_.toString(currentAccount.keyboard) === 'refProfileSubscriptionCheck::start'
            ) {

              /**
               * Отправляем сообщение о необходимости завершить подписку
               */

              const msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
                client,
                messageData: sails.config.custom.pushMessages.scheduler.refProfileSubscriptionCheck.disableMainMenu,
              });

            } else {

              /**
               * Проверяем достижение дневного лимита отправки постов
               * и в зависимости от этого показываем соответствующую клавиатуру
               */

              const checkDayPostsJoiRaw = await sails.helpers.general.checkDayPostsJoi({
                client,
              });

              if (checkDayPostsJoiRaw.status !== 'ok') {
                // throw new Error(`${moduleName}, error: wrong checkDayPostsJoi reply:
                // client: ${client}
                // checkDayPostsJoiRaw: ${checkDayPostsJoiRaw}`);

                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                  location: moduleName,
                  message: 'Wrong checkDayPostsJoi reply',
                  clientGuid: client.guid,
                  accountGuid: client.account_use,
                  errorName: sails.config.custom.CHAT_LISTENER_TELEGRAM_ERROR.name,
                  payload: {
                    checkDayPostsJoiRaw,
                  },
                });

              }

              const dayPostsReached =  checkDayPostsJoiRaw.payload.dayPostsReached;

              if (dayPostsReached) {

                /**
                 * Дневной лимит отправки постов достигнут
                 */

                currentAccount.keyboard = "main::check_post_limit";

              } else {

                /**
                 * Дневной лимит отправки постов НЕ достигнут
                 */

                currentAccount.keyboard = "main::place_post";

              }

              client.current_funnel = '';

              await sails.helpers.storage.clientUpdateJoi({
                criteria: {guid: client.guid},
                data: client,
                createdBy: moduleName,
              });

              const sendKeyboardForAccountParams = {
                client,
              };

              const sendKeyboardForAccountRaw = await sails.helpers.keyboardProcessor.sendKeyboardForAccountJoi(sendKeyboardForAccountParams);

              if (sendKeyboardForAccountRaw.status !== 'ok') {
                // throw new Error(`${moduleName}, error: wrong sendKeyboardForAccountJoi response
                //   sendKeyboardForAccountParams: ${JSON.stringify(sendKeyboardForAccountParams, null, 3)}
                //   sendKeyboardForAccountRaw: ${JSON.stringify(sendKeyboardForAccountRaw, null, 3)}`);

                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                  location: moduleName,
                  message: 'Wrong sendKeyboardForAccountJoi response',
                  clientGuid: client.guid,
                  accountGuid: client.account_use,
                  errorName: sails.config.custom.CHAT_LISTENER_TELEGRAM_ERROR.name,
                  payload: {
                    sendKeyboardForAccountParams,
                    sendKeyboardForAccountRaw,
                  },
                });

              }

            }

          } else {

            /**
             * Онбординг не завершен - толкаем выполнение текущей воронки
             */

            const initialBlock = _.find(client.funnels[client.current_funnel],
              {initial: true});

            await sails.helpers.funnel.proceedNextBlockJoi({
              client,
              funnelName: client.current_funnel,
              blockId: initialBlock.id,
              createdBy: moduleName,
            });

          }

        } else {

          /**
           * Check that funnels do not have big errors
           */

          // TODO: Убрать отсюда проверку воронок. Проверку воронок нужно делать один раз
          // при старте системы и реализовать возможность инициировать эту проверку через API
          // (это нужно для запуска проверки после загрузки обновления воронок)

          // await sails.helpers.general.checkFunnels(getClientResponse.payload);

          /**
           * Проверяем не относиться ли полученное сообщение к активной клавиатуре
           * и если относиться - выполняем необходимые действия
           */

          let keyboardInUse;

          const checkAndPerformKeyboardActionsJoiParams = {
            client,
            text: msg.text,
          };

          const checkAndPerformKeyboardActionsRaw = await sails.helpers.keyboardProcessor.checkAndPerformKeyboardActionsJoi(checkAndPerformKeyboardActionsJoiParams);

          if (checkAndPerformKeyboardActionsRaw.status === 'ok') {
            keyboardInUse = checkAndPerformKeyboardActionsRaw.payload.keyboardInUse;
          } else {
            // throw new Error(`${moduleName}, Critical error: wrong checkActiveKeyboardJoi response:
            // checkAndPerformKeyboardActionsJoiParams: ${JSON.stringify(checkAndPerformKeyboardActionsJoiParams, null, 3)}
            // checkAndPerformKeyboardActionsRaw: ${JSON.stringify(checkAndPerformKeyboardActionsRaw, null, 3)}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Wrong checkActiveKeyboardJoi response',
              clientGuid: client.guid,
              accountGuid: client.account_use,
              errorName: sails.config.custom.CHAT_LISTENER_TELEGRAM_ERROR.name,
              payload: {
                checkAndPerformKeyboardActionsJoiParams,
                checkAndPerformKeyboardActionsRaw,
              },
            });

          }

          if (!keyboardInUse) {

            await sails.helpers.funnel.supervisorTextJoi({
              client,
              msg,
            });

          }

        }

      } catch (e) {

        // const errorLocation = moduleName;
        // const errorMsg = `${moduleName}: ${sails.config.custom.ON_MESSAGE_ERROR}`;
        //
        // sails.log.error(errorLocation + ', error: ' + errorMsg);
        // sails.log.error(errorLocation + ', error details: ', e);
        //
        // throw {err: {
        //     module: errorLocation,
        //     message: errorMsg,
        //     payload: {
        //       error: e,
        //     },
        //   }
        // };

        const throwError = true;
        if (throwError) {
          return await sails.helpers.general.catchErrorJoi({
            error: e,
            location: moduleName,
            throwError: true,
          });
        } else {
          await sails.helpers.general.catchErrorJoi({
            error: e,
            location: moduleName,
            throwError: false,
          });
          return exits.success({
            status: 'ok',
            message: `${moduleName} performed`,
            payload: {},
          });
        }

      }

    });

    /**
     * The below return needed for normal functioning of config/bootstrap.js
     */

    return exits.success({
      status: 'ok',
      message: 'success',
      payload: {}
    });

  } //fn


};


