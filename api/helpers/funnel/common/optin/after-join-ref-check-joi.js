"use strict";

const Joi = require('@hapi/joi');
const sleep = require('util').promisify(setTimeout);
const moment = require('moment');

const moduleName = 'funnel:silver-personal:optin:after-join-ref-check-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:after-join-ref-check-joi',


  description: 'funnel:silver-personal:optin:after-join-ref-check-joi',


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

    let checkProfileSubscriptionResRaw;
    let parserStatus = '';
    const parserRequestIntervals = sails.config.custom.config.parsers.inst.errorSteps.checkRefSubscription.intervals;
    const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;
    const notifications = _.cloneDeep(sails.config.custom.config.parsers.inst.errorSteps.checkRefSubscription.notifications);

    let activeParser = null;
    const parserPlatformName = 'instagram';
    const parserModuleName = 'checkProfileSubscription';

    try {

      let updateBlock;
      let getBlock;
      let splitRes;
      let updateFunnel;
      let updateId;


      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const client = input.client;

      /**
       * формируем список профилей для проверки подписки на них
       */

      const refUpGetJoiParams = {
        criteria: {
          account_guid: currentAccount.guid,
          signed: false,
        },
      };

      const refUpRecsRaw = await sails.helpers.storage.refUpGetJoi(refUpGetJoiParams);

      if (refUpRecsRaw.status !== 'ok') {
        // throw new Error(`${moduleName}, error: wrong refUpGetJoi response:
        // refUpGetJoiParams: ${JSON.stringify(refUpGetJoiParams, null, 3)}
        // refUpRecsRaw: ${JSON.stringify(refUpRecsRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong refUpGetJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            refUpGetJoiParams,
            refUpRecsRaw,
          },
        });

      }

      const refUpGuids = [];

      _.forEach(refUpRecsRaw.payload, (refUpElem) => {
        refUpGuids.push(refUpElem.ref_account_guid);
      });

      const accountGetJoiParams = {
        accountGuids: refUpGuids,
      };

      const refAccountRecRaw = await sails.helpers.storage.accountGetJoi(accountGetJoiParams);

      if (refAccountRecRaw.status !== 'ok') {
        // throw new Error(`${moduleName}, error: wrong accountGetJoi response:
        // accountGetJoiParams: ${JSON.stringify(accountGetJoiParams, null, 3)}
        // refAccountRecRaw: ${JSON.stringify(refAccountRecRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong accountGetJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            accountGetJoiParams,
            refAccountRecRaw,
          },
        });

      }

      if (refAccountRecRaw.payload.length !== refUpGuids.length) {
        // throw new Error(`${moduleName}, error: wrong amount of records found:
        // accountGetJoiParams: ${JSON.stringify(accountGetJoiParams, null, 3)}
        // refAccountRecRaw: ${JSON.stringify(refAccountRecRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong amount of records found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            accountGetJoiParams,
            refAccountRecRaw,
          },
        });

      }

      const profilesList = [];
      const listProfilesAndAccountGuids = [];

      _.forEach(refAccountRecRaw.payload, (elem) => {
        profilesList.push(elem.inst_profile);
        listProfilesAndAccountGuids.push({
          profile: elem.inst_profile,
          accountGuid: elem.guid,
        });
      });

      // notifications.map((item) => {
      //   item.clientNotified = false;
      //   item.adminNotified = false;
      // });

      /**
       * Получаем имя парсера
       */

      const getParserParams = {
        platformName: parserPlatformName,
        moduleName: parserModuleName,
      };

      activeParser = await sails.helpers.parsers.getParserJoi(getParserParams);


      /**
       * Парсером проверяем подписки профиля
       */

      const checkProfileSubscriptionParams = {
        client,
        checkProfile: currentAccount.inst_profile,
        profileId: currentAccount.inst_id,
        profilesList,
      };

      let i = 0;

      const momentStart = moment();

      while (parserStatus !== 'success'
        && i < parserRequestIntervals.length
        ) {

        if (activeParser != null) {

          checkProfileSubscriptionResRaw = await sails.helpers.parsers.inst[activeParser].checkProfileSubscriptionJoi(checkProfileSubscriptionParams);

          parserStatus = checkProfileSubscriptionResRaw.status;

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
           * Логируем факт факапа парсера с фиксацией текущего интервала
           */

          const momentNow = moment();

          const requestDuration = moment.duration(momentNow.diff(momentStart)).asMilliseconds();

          /**
           * Логируем ошибку парсера
           */

          await LogProcessor.error({
            message: sails.config.custom.INST_PARSER_CHECK_PROFILE_SUBSCRIPTION_ERROR.message,
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_CHECK_PROFILE_SUBSCRIPTION_ERROR.name,
            location: moduleName,
            payload: {
              parserRequestInterval: parserRequestIntervals[i],
              requestDuration,
            },
          });

          /**
           * Передаём параметр для определения стартовой глубины поиска для повторной проверки
           */

          // checkProfileSubscriptionParams.checkRenewIndex = checkProfileSubscriptionResRaw.payload.checkRenewIndex || 0;

          await sleep(parserRequestIntervals[i] * parserRequestIntervalTime);

          activeParser = await sails.helpers.parsers.getParserJoi(getParserParams);

        }

        i++;

      }

      if (parserStatus !== 'success') {

        /**
         * Корректный ответ от парсера так и НЕ БЫЛ ПОЛУЧЕН
         */

        /**
         * Создаём запись для последующей обработки шедуллером
         */

        const pendingActionsCreateParams = {
          clientGuid,
          accountGuid,
          pendingActionName: sails.config.custom.enums.pendingActionsNames.REF_PROFILES_SUBSCRIPTION,
          actionsPerformed: 1,
          payload: {
            profiles: profilesList,
            listProfilesAndAccountGuids,
          },
        };

        const pendingActionsCreateRaw = await sails.helpers.storage.pendingActionsCreateJoi(pendingActionsCreateParams);

        if (pendingActionsCreateRaw.status == null || pendingActionsCreateRaw.status !== 'ok') {

          await LogProcessor.critical({
            message: 'PendingAction record create error',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.STORAGE_ERROR.name,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
            location: moduleName,
            payload: {
              pendingActionsCreateParams,
              pendingActionsCreateRaw,
            },
          });

        }

        /**
         * Выполняем переход на соответствующий блок воронки
         */

        input.block.next = 'optin::join_ref_check_error';
        input.block.done = true;
        input.block.shown = true;

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
          getBlock.previous = 'optin::join_ref_check';
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
         * Корректный ответ от парсера БЫЛ ПОЛУЧЕН
         */

        const checkProfileSubscriptionRes = checkProfileSubscriptionResRaw.payload;

        /**
         * устанавливаем в RefUp статус signed для аккаунтов профилей, на которые осуществлена подписка
         */

        if (checkProfileSubscriptionRes.subscribed.length > 0) {

          const signedAccountGuid = [];

          _.forEach(checkProfileSubscriptionRes.subscribed, (profile) => {

            const refListRec = _.find(refAccountRecRaw.payload, {inst_profile: profile});

            if (refListRec) {
              signedAccountGuid.push(refListRec.guid);
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

          input.block.next = 'optin::join_ref_done';
          input.block.done = true;
          input.block.shown = true;

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
            // throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Block parsing error',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
              payload: {
                block: input.block,
                updateBlock,
              },
            });

          }

          getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.shown = false;
            getBlock.done = false;
            getBlock.previous = 'optin::join_ref_check';
          } else {
            // throw new Error(`${moduleName}, error: block not found:
            //    updateBlock: ${updateBlock}
            //    updateFunnel: ${updateFunnel}
            //    updateId: ${updateId}
            //    input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);

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

          /**
           * Update 'optin::join_ref_missed_profiles' block
           */

          updateBlock = 'optin::join_ref_missed_profiles';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];

          if (_.isNil(updateFunnel)
            || _.isNil(updateId)
          ) {
            // throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);

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
              },
            });

          }

          getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.shown = true;
            getBlock.done = true;
            getBlock.previous = 'optin::join_ref_check';
          } else {
            // throw new Error(`${moduleName}, error: block not found:
            //    updateBlock: ${updateBlock}
            //    updateFunnel: ${updateFunnel}
            //    updateId: ${updateId}
            //    input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);

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
           * Подписка была выполнена НЕ на все профили
           */

          input.block.next = 'optin::join_ref_missed_profiles';
          input.block.done = true;
          input.block.shown = true;

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
            // throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);

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
            getBlock.previous = 'optin::join_ref_check';
            getBlock.next = null;
          } else {
            // throw new Error(`${moduleName}, error: block not found:
            //    updateBlock: ${updateBlock}
            //    updateFunnel: ${updateFunnel}
            //    updateId: ${updateId}
            //    input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);

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
            previous: false,
            switchFunnel: true,
            createdBy: moduleName,
          });


        }

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

