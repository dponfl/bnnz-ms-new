"use strict";

const Joi = require('@hapi/joi');
const sleep = require('util').promisify(setTimeout);
const moment = require('moment');

const moduleName = 'funnel:silver-personal:ref-profile-subscription-check:after-subscription-check-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:ref-profile-subscription-check:after-subscription-check-joi',


  description: 'funnel:silver-personal:ref-profile-subscription-check:after-subscription-check-joi',


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

    let input;

    let clientGuid;
    let accountGuid;

    let checkProfileSubscriptionResRaw;
    let parserStatus = '';
    const parserRequestIntervals = sails.config.custom.config.parsers.inst.errorSteps.checkRefSubscription.intervals;
    const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;

    let pendingActionsRec;

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

      /**
       * формируем список профилей для проверки подписки на них
       */


      const pendingActionsGetParams = {
        criteria: {
          clientGuid,
          accountGuid,
          pendingActionName: sails.config.custom.enums.pendingActionsNames.REF_PROFILES_SUBSCRIPTION,
          done: false,
          deleted: false,
        }
      };

      const pendingRrofilesRaw = await sails.helpers.storage.pendingActionsGetJoi(pendingActionsGetParams);

      if (pendingRrofilesRaw.status !== 'ok'
        || pendingRrofilesRaw.payload.length > 1
      ) {

        /**
         * Логируем ошибку и переводим клиента в блок join_ref_check_error
         * чтобы он мог продолжать пользоваться сервисом
         */

        if (pendingRrofilesRaw.status !== 'ok') {

          await LogProcessor.critical({
            message: 'Wrong response from pendingActionsGetJoi',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.KEYBOARDS_ERROR.name,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            payload: {
              pendingActionsGetParams,
              pendingRrofilesRaw,
            },
          });

        }

        if (pendingRrofilesRaw.payload.length > 1) {

          await LogProcessor.critical({
            message: 'pendingActionsGetJoi for criteria returns more than one record',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.KEYBOARDS_ERROR.name,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            payload: {
              pendingActionsGetParams,
              pendingRrofilesRaw,
            },
          });

        }


        /**
         * Выполняем переход на join_ref_check_error
         */

        const nextBlockActivationGenericParams = {
          client: input.client,
          account: currentAccount,
          block: input.block,
          updateElement: 'next',
          updateElementValue: 'refProfileSubscriptionCheck::join_ref_check_error',
          updateElementPreviousValue: 'refProfileSubscriptionCheck::join_ref_check',
          createdBy: moduleName,
          msg: input.msg,
        };

        await sails.helpers.funnel.nextBlockActivationGenericJoi(nextBlockActivationGenericParams);

        // input.block.next = 'refProfileSubscriptionCheck::join_ref_check_error';
        // input.block.done = true;
        // input.block.shown = true;
        //
        // /**
        //  * Update input.block.next block
        //  */
        //
        // updateBlock = input.block.next;
        //
        // splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
        // updateFunnel = splitRes[0];
        // updateId = splitRes[1];
        //
        // if (_.isNil(updateFunnel)
        //   || _.isNil(updateId)
        // ) {
        //
        //   await sails.helpers.general.throwErrorJoi({
        //     errorType: sails.config.custom.enums.errorType.CRITICAL,
        //     emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
        //     location: moduleName,
        //     message: 'Block parsing error',
        //     clientGuid,
        //     accountGuid,
        //     errorName: sails.config.custom.FUNNELS_ERROR.name,
        //     payload: {
        //       updateBlock,
        //       block: input.block,
        //     },
        //   });
        //
        // }
        //
        // getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});
        //
        // if (getBlock) {
        //   getBlock.shown = false;
        //   getBlock.done = false;
        //   getBlock.previous = 'refProfileSubscriptionCheck::join_ref_check';
        // } else {
        //
        //   await sails.helpers.general.throwErrorJoi({
        //     errorType: sails.config.custom.enums.errorType.CRITICAL,
        //     emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
        //     location: moduleName,
        //     message: 'Block not found',
        //     clientGuid,
        //     accountGuid,
        //     errorName: sails.config.custom.FUNNELS_ERROR.name,
        //     payload: {
        //       updateId,
        //       updateFunnel,
        //       funnel: input.client.funnels[updateFunnel],
        //     },
        //   });
        //
        // }
        //
        // await sails.helpers.funnel.afterHelperGenericJoi({
        //   client: input.client,
        //   block: input.block,
        //   msg: input.msg,
        //   next: true,
        //   previous: true,
        //   switchFunnel: true,
        //   createdBy: moduleName,
        // });


      } else {

        pendingActionsRec = pendingRrofilesRaw.payload[0];

        const profilesList = _.get(pendingActionsRec, 'payload.profiles', null);
        const profilesAndAccountGuidsList = _.get(pendingActionsRec, 'payload.listProfilesAndAccountGuids', null);

        if (profilesList == null || profilesAndAccountGuidsList == null) {

          /**
           * Логируем ошибку и переводим клиента в блок join_ref_check_error
           * чтобы он мог продолжать пользоваться сервисом
           */

          await LogProcessor.critical({
            message: 'Wrong response from pendingActionsGetJoi',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.KEYBOARDS_ERROR.name,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            payload: {
              pendingActionsGetParams,
              pendingRrofilesRaw,
            },
          });

          /**
           * Выполняем переход на join_ref_check_error
           */

          const nextBlockActivationGenericParams = {
            client: input.client,
            account: currentAccount,
            block: input.block,
            updateElement: 'next',
            updateElementValue: 'refProfileSubscriptionCheck::join_ref_check_error',
            updateElementPreviousValue: 'refProfileSubscriptionCheck::join_ref_check',
            createdBy: moduleName,
            msg: input.msg,
          };

          await sails.helpers.funnel.nextBlockActivationGenericJoi(nextBlockActivationGenericParams);


          // input.block.next = 'refProfileSubscriptionCheck::join_ref_check_error';
          // input.block.done = true;
          // input.block.shown = true;
          //
          // /**
          //  * Update input.block.next block
          //  */
          //
          // updateBlock = input.block.next;
          //
          // splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          // updateFunnel = splitRes[0];
          // updateId = splitRes[1];
          //
          // if (_.isNil(updateFunnel)
          //   || _.isNil(updateId)
          // ) {
          //
          //   await sails.helpers.general.throwErrorJoi({
          //     errorType: sails.config.custom.enums.errorType.CRITICAL,
          //     emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          //     location: moduleName,
          //     message: 'Block parsing error',
          //     clientGuid,
          //     accountGuid,
          //     errorName: sails.config.custom.FUNNELS_ERROR.name,
          //     payload: {
          //       updateBlock,
          //       block: input.block,
          //     },
          //   });
          //
          // }
          //
          // getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});
          //
          // if (getBlock) {
          //   getBlock.shown = false;
          //   getBlock.done = false;
          //   getBlock.previous = 'refProfileSubscriptionCheck::join_ref_check';
          // } else {
          //
          //   await sails.helpers.general.throwErrorJoi({
          //     errorType: sails.config.custom.enums.errorType.CRITICAL,
          //     emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          //     location: moduleName,
          //     message: 'Block not found',
          //     clientGuid,
          //     accountGuid,
          //     errorName: sails.config.custom.FUNNELS_ERROR.name,
          //     payload: {
          //       updateId,
          //       updateFunnel,
          //       funnel: input.client.funnels[updateFunnel],
          //     },
          //   });
          //
          // }
          //
          // await sails.helpers.funnel.afterHelperGenericJoi({
          //   client: input.client,
          //   block: input.block,
          //   msg: input.msg,
          //   next: true,
          //   previous: true,
          //   switchFunnel: true,
          //   createdBy: moduleName,
          // });

        } else {

          /**
           * Парсером проверяем подписки профиля
           */

          const activeParser = sails.config.custom.config.parsers.inst.activeParserName;

          const checkProfileSubscriptionParams = {
            checkProfile: currentAccount.inst_profile,
            profileId: currentAccount.inst_id,
            profilesList,
          };

          let i = 0;

          const momentStart = moment();

          while (parserStatus !== 'success'
            && i < parserRequestIntervals.length
            ) {

            checkProfileSubscriptionResRaw = await sails.helpers.parsers.inst[activeParser].checkProfileSubscriptionJoi(checkProfileSubscriptionParams);

            parserStatus = checkProfileSubscriptionResRaw.status;

            if (parserStatus !== 'success') {

              /**
               * Логируем факт факапа парсера с фиксацией текущего интервала
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
                  requestDuration,
                },
              });

              await sleep(parserRequestIntervals[i] * parserRequestIntervalTime);

            }

            i++;

          }

          if (parserStatus !== 'success') {

            /**
             * Корректный ответ от парсера так и НЕ БЫЛ ПОЛУЧЕН
             */

            /**
             * Обновляем запись для последующей обработки шедуллером
             */

            pendingActionsRec.actionsPerformed++;

            await sails.helpers.storage.pendingActionsUpdateJoi({
              criteria: {
                guid: pendingActionsRec.guid,
              },
              data: {
                actionsPerformed: pendingActionsRec.actionsPerformed,
              }
            });

            /**
             * Выполняем переход на join_ref_check_error
             */

            const nextBlockActivationGenericParams = {
              client: input.client,
              account: currentAccount,
              block: input.block,
              updateElement: 'next',
              updateElementValue: 'refProfileSubscriptionCheck::join_ref_check_error',
              updateElementPreviousValue: 'refProfileSubscriptionCheck::join_ref_check',
              createdBy: moduleName,
              msg: input.msg,
            };

            await sails.helpers.funnel.nextBlockActivationGenericJoi(nextBlockActivationGenericParams);


            // input.block.next = 'refProfileSubscriptionCheck::join_ref_check_error';
            // input.block.done = true;
            // input.block.shown = true;
            //
            // /**
            //  * Update input.block.next block
            //  */
            //
            // updateBlock = input.block.next;
            //
            // splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
            // updateFunnel = splitRes[0];
            // updateId = splitRes[1];
            //
            // if (_.isNil(updateFunnel)
            //   || _.isNil(updateId)
            // ) {
            //
            //   await sails.helpers.general.throwErrorJoi({
            //     errorType: sails.config.custom.enums.errorType.CRITICAL,
            //     emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            //     location: moduleName,
            //     message: 'Block parsing error',
            //     clientGuid,
            //     accountGuid,
            //     errorName: sails.config.custom.FUNNELS_ERROR.name,
            //     payload: {
            //       updateBlock,
            //       block: input.block,
            //     },
            //   });
            //
            // }
            //
            // getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});
            //
            // if (getBlock) {
            //   getBlock.shown = false;
            //   getBlock.done = false;
            //   getBlock.previous = 'refProfileSubscriptionCheck::join_ref_check';
            // } else {
            //
            //   await sails.helpers.general.throwErrorJoi({
            //     errorType: sails.config.custom.enums.errorType.CRITICAL,
            //     emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            //     location: moduleName,
            //     message: 'Block not found',
            //     clientGuid,
            //     accountGuid,
            //     errorName: sails.config.custom.FUNNELS_ERROR.name,
            //     payload: {
            //       updateId,
            //       updateFunnel,
            //       funnel: input.client.funnels[updateFunnel],
            //     },
            //   });
            //
            // }
            //
            // await sails.helpers.funnel.afterHelperGenericJoi({
            //   client: input.client,
            //   block: input.block,
            //   msg: input.msg,
            //   next: true,
            //   previous: true,
            //   switchFunnel: true,
            //   createdBy: moduleName,
            // });


          } else {

            /**
             * Корректный ответ от парсера БЫЛ ПОЛУЧЕН
             */

            const checkProfileSubscriptionRes = checkProfileSubscriptionResRaw.payload;

            /**
             * устанавливаем в RefUp статус signed для аккаунтов профилей, на которые осуществлена подписка
             */

            if (checkProfileSubscriptionRes.subscribed.length > 0) {

              const signedAccountGuid = [];

              _.forEach(checkProfileSubscriptionRes.subscribed, (profile) => {

                const refListRec = _.find(profilesAndAccountGuidsList, {profile: profile});

                if (refListRec) {
                  signedAccountGuid.push(refListRec.accountGuid);
                }

              });

              await sails.helpers.storage.refUpUpdateJoi({
                criteria: {
                  account_guid: currentAccount.guid,
                  ref_account_guid: signedAccountGuid,
                },
                data: {
                  signed: true,
                },
                createdBy: moduleName,
              });

            }

            if (checkProfileSubscriptionRes.allSubscribed) {

              /**
               * Подписка на все профили была выполнена
               */

              /**
               * Выполняем переход на join_ref_done
               */

              const nextBlockActivationGenericParams = {
                client: input.client,
                account: currentAccount,
                block: input.block,
                updateElement: 'next',
                updateElementValue: 'refProfileSubscriptionCheck::join_ref_done',
                updateElementPreviousValue: 'refProfileSubscriptionCheck::join_ref_check',
                createdBy: moduleName,
                msg: input.msg,
              };

              await sails.helpers.funnel.nextBlockActivationGenericJoi(nextBlockActivationGenericParams);


            } else {

              /**
               * Подписка была выполнена НЕ на все профили
               */

              const moveToKeyboardGenericParams = {

                client: input.client,
                block: input.block,
                keyboardName: 'refProfileSubscriptionCheck::start',
                afterHelperNext: false,
                msg: input.msg,
                createdBy: moduleName,

              };

              await sails.helpers.funnel.moveToKeyboardGenericJoi(moveToKeyboardGenericParams);

            }

          }

        }

      }


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
            input,
          }
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
            input,
          }
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

