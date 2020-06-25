"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'funnel:silver-personal:main:after-post-performed-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:main:after-post-performed-joi',


  description: 'funnel:silver-personal:main:after-post-performed-joi',


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

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      input = await schema.validateAsync(inputs.params);

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      const checkDayPostsJoiRaw = await sails.helpers.general.checkDayPostsJoi({
        client: input.client,
      });

      if (checkDayPostsJoiRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong checkDayPostsJoi reply:
          client: ${input.client}
          checkDayPostsJoiRaw: ${checkDayPostsJoiRaw}`);
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
        throw new Error(`${moduleName}, error: wrong sendKeyboardForAccountJoi response
        sendKeyboardForAccountParams: ${JSON.stringify(sendKeyboardForAccountParams, null, 3)}
        sendKeyboardForAccountRaw: ${JSON.stringify(sendKeyboardForAccountRaw, null, 3)}`);
      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};

