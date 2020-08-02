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

    let input;

    let checkProfileRaw;
    let parserStatus = '';
    const parserRequestIntervals = sails.config.custom.config.parsers.inst.errorSteps.intervals;
    const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;
    const notificationInterval = sails.config.custom.config.parsers.inst.errorSteps.notificationInterval;
    let infoMessageWasSend = false;

    let profileExists = false;
    let profileId = null;
    let profilePic = null;


    try {

      input = await schema.validateAsync(inputs.params);

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const client = input.client;

      const instProfile = input.client.inst_profile_tmp;
      const activeParser = sails.config.custom.config.parsers.inst.activeParserName;

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

          if (requestDuration > notificationInterval && !infoMessageWasSend) {

            /**
             * Отправляем информационное сообщение
             */

            const infoMessageParams = {
              client,
              messageData: sails.config.custom.pushMessages.funnels.optin.instParserErrorResponse.checkProfile,
            };

            const sendMessageRes = await sails.helpers.messageProcessor.sendMessageJoi(infoMessageParams);

            infoMessageWasSend = true;

          }

          /**
           * Логируем ошибку парсера
           */

          sails.log.error(`${moduleName} Instagram parser error: enable interval: ${parserRequestIntervals[i]}`);

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

        // TODO: Здесь должно быть применено логирование для серьёзных ошибок
        sails.log.error(`${moduleName}: Успешный ответ от парсера так и не был получен`);

      }

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

