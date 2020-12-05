"use strict";

const Joi = require('@hapi/joi');
const sleep = require('util').promisify(setTimeout);
const moment = require('moment');

const moduleName = 'funnel:common:optin:after-check-profile-joi';


module.exports = {


  friendlyName: 'funnel:common:optin:after-check-profile-joi',


  description: 'funnel:common:optin:after-check-profile-joi',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
      type: 'ref',
      required: true,
    },

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

    const schema = Joi.object({
      client: Joi
        .any()
        .description('Client record')
        .required(),
      block: Joi
        .any()
        .description('Current funnel block')
        .required(),
      msg: Joi
        .any()
        .description('Message received'),
    });

    let clientGuid;
    let accountGuid;

    let input;

    let checkProfileRaw;
    let parserStatus = '';
    const parserRequestIntervals = sails.config.custom.config.parsers.inst.errorSteps.checkProfile.intervals;
    const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;
    const notifications = _.cloneDeep(sails.config.custom.config.parsers.inst.errorSteps.checkProfile.notifications);

    let activeParser = null;
    const parserPlatformName = 'instagram';
    const parserModuleName = 'checkProfileExists';


    let profileExists = false;
    let profileId = null;
    let profilePic = null;

    let pushMessage;

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const client = input.client;

      const instProfile = input.client.inst_profile_tmp;

      /**
       * Получаем имя парсера
       */

      const getParserParams = {
        platformName: parserPlatformName,
        moduleName: parserModuleName,
      };

      activeParser = await sails.helpers.parsers.getParserJoi(getParserParams);

      notifications.map((item) => {
        item.clientNotified = false;
        item.adminNotified = false;
      });

      /**
       * Парсером проверяем, что этот профиль существует в Instagram
       */


      let i = 0;

      const momentStart = moment();

      while (parserStatus !== 'success' && i < parserRequestIntervals.length) {

        if (activeParser != null) {

          checkProfileRaw = await sails.helpers.parsers.inst[activeParser].checkProfileExistsJoi({
            client,
            instProfile,
          });

          parserStatus = checkProfileRaw.status;

        } else {

          parserStatus = 'error';

        }

        if (parserStatus !== 'success') {

          if (activeParser != null) {

            /**
             * выставляем флаг, что парсер неактивен
             */

            const apiStatusUpdateParams = {
              platformName: parserPlatformName,
              moduleName: parserModuleName,
              parserName: activeParser,
              data: {
                key: 'active',
                value: false,
              },
              createdBy: moduleName,
            };

            await sails.helpers.storage.apiStatusUpdateJoi(apiStatusUpdateParams);

          }


          /**
           * Проверяем условие отправки информационного сообщения клиенту
           * и логируем факт факапа парсера с фиксацией текущего интервала
           */

          const momentNow = moment();

          const requestDuration = moment.duration(momentNow.diff(momentStart)).asMilliseconds();

          /**
           * Логируем ошибку парсера
           */


          await LogProcessor.error({
            message: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR.message,
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR.name,
            location: moduleName,
            payload: {
              parserRequestInterval: parserRequestIntervals[i],
            },
          });

          for (const elem of notifications) {

            if (requestDuration > elem.notificationInterval * parserRequestIntervalTime) {

              if (elem.sendMessageToClient && !elem.clientNotified) {

                /**
                 * Отправляем информационное сообщение клиенту
                 */

                /**
                 * Достаём данные PushMessage
                 */

                const pushMessageName = currentAccount.service.push_message_name;

                const pushMessageGetParams = {
                  pushMessageName,
                };

                const pushMessageGetRaw = await sails.helpers.storage.pushMessageGetJoi(pushMessageGetParams);

                if (pushMessageGetRaw.status !== 'ok') {
                  await sails.helpers.general.throwErrorJoi({
                    errorType: sails.config.custom.enums.errorType.ERROR,
                    location: moduleName,
                    message: 'Wrong pushMessageGetJoi response',
                    clientGuid,
                    accountGuid,
                    errorName: sails.config.custom.STORAGE_ERROR.name,
                    payload: {
                      pushMessageGetParams,
                      pushMessageGetRaw,
                    },
                  });

                }

                pushMessage = pushMessageGetRaw.payload;

                const messageDataPath = 'funnels.optin.instParserErrorResponse.checkProfile';
                const messageData = _.get(pushMessage, messageDataPath, null);

                if (messageData == null) {
                  await sails.helpers.general.throwErrorJoi({
                    errorType: sails.config.custom.enums.errorType.ERROR,
                    location: moduleName,
                    message: 'No expected messageData',
                    clientGuid,
                    accountGuid,
                    errorName: sails.config.custom.STORAGE_ERROR.name,
                    payload: {
                      pushMessage,
                      messageDataPath,
                      messageData,
                    },
                  });
                }

                const infoMessageParams = {
                  client,
                  messageData,
                };

                const sendMessageRes = await sails.helpers.messageProcessor.sendMessageJoi(infoMessageParams);

                elem.clientNotified = true;

              }

              if (elem.sendMessageToAdmin && !elem.adminNotified) {

                /**
                 * Генерим сообщение о критической ошибке
                 */

                await LogProcessor.critical({
                  message: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR.message,
                  clientGuid,
                  accountGuid,
                  // requestId: null,
                  // childRequestId: null,
                  errorName: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR.name,
                  location: moduleName,
                  emergencyLevel: elem.emergencyLevel,
                  payload: {
                    notificationInterval: `${elem.notificationInterval} seconds`,
                    parserRequestInterval: parserRequestIntervals[i],
                  },
                });

                elem.adminNotified = true;

              }

            }

          }

          await sleep(parserRequestIntervals[i] * parserRequestIntervalTime);

          activeParser = await sails.helpers.parsers.getParserJoi(getParserParams);

        }

        i++;
      }

      if (parserStatus === 'success') {

        profileExists = checkProfileRaw.payload.profileExists;
        profileId = checkProfileRaw.payload.profileId;
        profilePic = checkProfileRaw.payload.profilePicUrl;

        if (profileExists) {

          currentAccount.profile_provided = true;
          currentAccount.inst_id = profileId;
          currentAccount.inst_pic = profilePic;

          input.block.done = true;
          input.block.shown = true;
          input.block.next = 'optin::confirm_profile';

        } else {

          input.client.inst_profile_tmp = null;
          input.block.done = true;
          input.block.shown = true;
          input.block.next = 'optin::wrong_profile';

        }

        /**
         * Update input.block.next block
         */

        updateBlock = input.block.next;

        splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
        updateFunnel = splitRes[0];
        updateId = splitRes[1];

        if (_.isNil(updateFunnel)
          || _.isNil(updateId)
        ) {

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block parsing error',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              updateBlock,
              block: input.block,
            },
          });

        }

        getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

        if (getBlock) {
          getBlock.shown = false;
          getBlock.done = false;
          getBlock.enabled = true;
          getBlock.previous = `${input.client.current_funnel}::${input.block.id}`;
        } else {

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block not found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              updateId,
              updateFunnel,
              funnel: input.client.funnels[updateFunnel],
            },
          });

        }

        await sails.helpers.funnel.afterHelperGenericJoi({
          client: input.client,
          block: input.block,
          msg: input.msg,
          next: true,
          previous: true,
          switchFunnel: true,
          createdBy: moduleName,
        });

      } else {

        /**
         * Успешный ответ от парсера так и не был получен
         */

        // await LogProcessor.critical({
        //   message: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL.message,
        //   clientGuid,
        //   accountGuid,
        //   // requestId: null,
        //   // childRequestId: null,
        //   errorName: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL.name,
        //   location: moduleName,
        //   emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
        //   payload: {},
        // });
        //
        // throw new Error(sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL.message);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          location: moduleName,
          message: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL.message,
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL.name,
          payload: {},
        });


      }



      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = e.message || `General error`;
      //
      // await LogProcessor.error({
      //   message: errorMsg,
      //   clientGuid,
      //   accountGuid,
      //   // requestId: null,
      //   // childRequestId: null,
      //   errorName: e.name || 'none',
      //   location: errorLocation,
      //   payload: e.raw || {},
      // });
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e.raw || {},
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

  }

};

