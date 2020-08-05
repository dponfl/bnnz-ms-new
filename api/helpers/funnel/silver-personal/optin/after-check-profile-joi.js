"use strict";

const Joi = require('@hapi/joi');
const sleep = require('util').promisify(setTimeout);
const moment = require('moment');

const moduleName = 'funnel:silver-personal:optin:after-check-profile-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:after-check-profile-joi',


  description: 'funnel:silver-personal:optin:after-check-profile-joi',


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
    const parserRequestIntervals = sails.config.custom.config.parsers.inst.errorSteps.intervals;
    const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;
    const checkNotifications = sails.config.custom.config.parsers.inst.errorSteps.notifications;
    const notifications = _.clone(sails.config.custom.config.parsers.inst.errorSteps.notifications);

    let profileExists = false;
    let profileId = null;
    let profilePic = null;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const client = input.client;

      const instProfile = input.client.inst_profile_tmp;
      const activeParser = sails.config.custom.config.parsers.inst.activeParserName;

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

        checkProfileRaw = await sails.helpers.parsers.inst[activeParser].checkProfileExistsJoi({
          client,
          instProfile,
        });

        parserStatus = checkProfileRaw.status;

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

            if (requestDuration > elem.notificationInterval * parserRequestIntervalTime
            ) {

              if (elem.sendMessageToClient && !elem.clientNotified) {

                /**
                 * Отправляем информационное сообщение клиенту
                 */

                const infoMessageParams = {
                  client,
                  messageData: sails.config.custom.pushMessages.funnels.optin.instParserErrorResponse.checkProfile,
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

        await LogProcessor.critical({
          message: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_CHECK_PROFILE_EXISTS_ERROR_FINAL.name,
          location: moduleName,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.highest,
          payload: {
            parserRequestInterval: parserRequestIntervals[i],
          },
        });

      }

      // "intervals": [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229, 832040, 1346269]

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);

      throw {err: {
          module: `${moduleName}`,
          message: errorMsg,
          payload: {
            error_name: e.name || 'no name',
            error_message: e.message || 'no message',
            error_stack: e.stack || {},
          },
        }
      };

    }

  }

};

