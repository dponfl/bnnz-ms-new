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
    const notifications = _.cloneDeep(sails.config.custom.config.parsers.inst.errorSteps.notifications);

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

            if (requestDuration > elem.notificationInterval * parserRequestIntervalTime) {

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
                    notificationInterval: `${elem.notificationInterval} seconds`,
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

        // "notifications": [
        //   {
        //     "notificationInterval": 30,
        //     "emergencyLevel": "low",
        //     "sendMessageToClient": true,
        //     "sendMessageToAdmin": true
        //   },
        //   {
        //     "notificationInterval": 300,
        //     "emergencyLevel": "medium",
        //     "sendMessageToClient": false,
        //     "sendMessageToAdmin": true
        //   },
        //   {
        //     "notificationInterval": 3600,
        //     "emergencyLevel": "high",
        //     "sendMessageToClient": false,
        //     "sendMessageToAdmin": true
        //   }
        // ],
        // "intervals": [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229, 832040, 1346269]


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

