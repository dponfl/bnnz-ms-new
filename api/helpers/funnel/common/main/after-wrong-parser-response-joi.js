"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'funnel:common:main:after-wrong-parser-response-joi';


module.exports = {


  friendlyName: 'funnel:common:main:after-wrong-parser-response-joi',


  description: 'funnel:common:main:after-wrong-parser-response-joi',


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


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      const checkDayPostsJoiRaw = await sails.helpers.general.checkDayPostsJoi({
        client: input.client,
      });

      if (checkDayPostsJoiRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong checkDayPostsJoi reply',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
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

      input.client.current_funnel = '';

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: input.client.guid},
        data: input.client,
        createdBy: moduleName,
      });

      const dropDailyCountersAtObj = sails.config.custom.config.general.dropDailyCountersAt;
      const countersDropMoment = moment()
        .startOf('day')
        .add(1, 'days')
        .add(dropDailyCountersAtObj.h, 'hours')
        .add(dropDailyCountersAtObj.m, 'minutes')
        .add(dropDailyCountersAtObj.s, 'seconds');
      const currentMoment = moment();
      const dropCountersDuration = moment.duration(countersDropMoment.diff(currentMoment));

      const sendKeyboardForAccountParams = {
        client: input.client,
        additionalTokens: [
          {
            token: '$nextPostInTimeHours$',
            value: dropCountersDuration.hours(),
          },
          {
            token: '$nextPostInTimeMinutes$',
            value: dropCountersDuration.minutes(),
          },
        ],
      };

      const sendKeyboardForAccountRaw = await sails.helpers.keyboardProcessor.sendKeyboardForAccountJoi(sendKeyboardForAccountParams);

      if (sendKeyboardForAccountRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong sendKeyboardForAccountJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            sendKeyboardForAccountParams,
            sendKeyboardForAccountRaw,
          },
        });
      }

      /**
       * Сбрасываем флаг блокировки отправки сообщений
       */

      await sails.helpers.general.setClientDndJoi({
        clientGuid,
        accountGuid,
        dnd: false,
      });


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

