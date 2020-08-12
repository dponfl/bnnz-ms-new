"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'keyboards:silver-personal:main:check-send-post-limits-joi';


module.exports = {


  friendlyName: 'keyboards:silver-personal:main:check-send-post-limits-joi',


  description: 'keyboards:silver-personal:main:check-send-post-limits-joi',


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
        .description('client object')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;

    let currentAccount;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      const checkDayPostsJoiRaw = await sails.helpers.general.checkDayPostsJoi({
        client: input.client,
      });

      if (checkDayPostsJoiRaw.status !== 'ok') {
        // throw new Error(`${moduleName}, error: wrong checkDayPostsJoi reply:
        //   client: ${input.client}
        //   checkDayPostsJoiRaw: ${checkDayPostsJoiRaw}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong checkDayPostsJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.KEYBOARDS_ERROR,
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
        // throw new Error(`${moduleName}, error: wrong sendKeyboardForAccountJoi response
        // sendKeyboardForAccountParams: ${JSON.stringify(sendKeyboardForAccountParams, null, 3)}
        // sendKeyboardForAccountRaw: ${JSON.stringify(sendKeyboardForAccountRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong sendKeyboardForAccountJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.KEYBOARDS_ERROR,
          payload: {
            sendKeyboardForAccountParams,
            sendKeyboardForAccountRaw,
          },
        });

      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      // const errorMsg = 'General error';
      //
      // sails.log.error(`${moduleName}, Error details:
      // Platform error message: ${errorMsg}
      // Error name: ${e.name || 'no name'}
      // Error message: ${e.message || 'no message'}
      // Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);
      //
      // throw {err: {
      //     module: `${moduleName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
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

