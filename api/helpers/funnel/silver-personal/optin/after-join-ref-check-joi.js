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
    const parserRequestIntervals = sails.config.custom.config.parsers.inst.errorSteps.intervals;
    const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;
    const checkNotifications = sails.config.custom.config.parsers.inst.errorSteps.notifications;
    const notifications = _.cloneDeep(sails.config.custom.config.parsers.inst.errorSteps.notifications);

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
        throw new Error(`${moduleName}, error: wrong refUpGetJoi response:
        refUpGetJoiParams: ${JSON.stringify(refUpGetJoiParams, null, 3)}
        refUpRecsRaw: ${JSON.stringify(refUpRecsRaw, null, 3)}`);
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
        throw new Error(`${moduleName}, error: wrong accountGetJoi response:
        accountGetJoiParams: ${JSON.stringify(accountGetJoiParams, null, 3)}
        refAccountRecRaw: ${JSON.stringify(refAccountRecRaw, null, 3)}`);
      }

      if (refAccountRecRaw.payload.length !== refUpGuids.length) {
        throw new Error(`${moduleName}, error: wrong amount of records found:
        accountGetJoiParams: ${JSON.stringify(accountGetJoiParams, null, 3)}
        refAccountRecRaw: ${JSON.stringify(refAccountRecRaw, null, 3)}`);
      }

      const profilesList = [];

      _.forEach(refAccountRecRaw.payload, (elem) => {
        profilesList.push(elem.inst_profile);
      });

      notifications.map((item) => {
        item.clientNotified = false;
        item.adminNotified = false;
      });

      /**
       * Парсером проверяем подписки профиля
       */

      const checkProfileSubscriptionParams = {
        client,
        checkProfile: currentAccount.inst_profile,
        profileId: currentAccount.inst_id,
        profilesList,
      };

      const activeParser = sails.config.custom.config.parsers.inst.activeParserName;

      let i = 0;

      const momentStart = moment();

      while (parserStatus !== 'success' && i < parserRequestIntervals.length) {

        checkProfileSubscriptionResRaw = await sails.helpers.parsers.inst[activeParser].checkProfileSubscriptionJoi(checkProfileSubscriptionParams);

        parserStatus = checkProfileSubscriptionResRaw.status;

        if (parserStatus !== 'success') {

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
                 * Отправляем информационное сообщение
                 */

                const infoMessageParams = {
                  client,
                  messageData: sails.config.custom.pushMessages.funnels.optin.instParserErrorResponse.joinRefCheck,
                };

                const sendMessageRes = await sails.helpers.messageProcessor.sendMessageJoi(infoMessageParams);

                elem.clientNotified = true;

              }

              if (elem.sendMessageToAdmin && !elem.adminNotified) {

                /**
                 * Генерим сообщение о критической ошибке
                 */

                await LogProcessor.critical({
                  message: sails.config.custom.INST_PARSER_CHECK_PROFILE_SUBSCRIPTION_ERROR.message,
                  clientGuid,
                  accountGuid,
                  // requestId: null,
                  // childRequestId: null,
                  errorName: sails.config.custom.INST_PARSER_CHECK_PROFILE_SUBSCRIPTION_ERROR.name,
                  location: moduleName,
                  emergencyLevel: elem.emergencyLevel,
                  payload: {
                    parserRequestInterval: parserRequestIntervals[i],
                  },
                });

                elem.adminNotified = true;

              }

            }

          }

          await sleep(parserRequestIntervals[i] * parserRequestIntervalTime);

        }

        i++;

      }

      if (parserStatus !== 'success') {

        /**
         * Корректный ответ от парсера так и НЕ БЫЛ ПОЛУЧЕН
         */

        await LogProcessor.critical({
          message: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL.name,
          location: moduleName,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
          payload: {},
        });

        throw new Error(sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL.message);

      }

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
          throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);
        }

        getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

        if (getBlock) {
          getBlock.shown = false;
          getBlock.done = false;
          getBlock.previous = 'optin::join_ref_check';
        } else {
          throw new Error(`${moduleName}, error: block not found:
             updateBlock: ${updateBlock}
             updateFunnel: ${updateFunnel}
             updateId: ${updateId}
             input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);
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
          throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);
        }

        getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

        if (getBlock) {
          getBlock.shown = true;
          getBlock.done = true;
          getBlock.previous = 'optin::join_ref_check';
        } else {
          throw new Error(`${moduleName}, error: block not found:
             updateBlock: ${updateBlock}
             updateFunnel: ${updateFunnel}
             updateId: ${updateId}
             input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);
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
          throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);
        }

        getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

        if (getBlock) {
          getBlock.shown = false;
          getBlock.done = false;
          getBlock.previous = 'optin::join_ref_check';
          getBlock.next = null;
        } else {
          throw new Error(`${moduleName}, error: block not found:
             updateBlock: ${updateBlock}
             updateFunnel: ${updateFunnel}
             updateId: ${updateId}
             input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);
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


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = e.message || `General error`;

      await LogProcessor.error({
        message: errorMsg,
        clientGuid,
        accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: e.name || 'none',
        location: errorLocation,
        payload: e.raw || {},
      });

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e.raw || {},
          },
        }
      };

    }

  }

};

