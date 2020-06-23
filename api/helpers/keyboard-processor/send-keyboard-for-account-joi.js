"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboard-processor:send-keyboard-for-account-joi';


module.exports = {


  friendlyName: 'keyboard-processor:send-keyboard-for-account-joi',


  description: 'keyboard-processor:send-keyboard-for-account-joi',


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
      additionalTokens: Joi
        .any(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      const keyboardName = currentAccount.service.keyboard_name;

      /**
       * Достаём данные по активной клавиатуре
       */

      const keyboardGetParams = {
        keyboardName,
      };

      const keyboardGetRaw = await sails.helpers.storage.keyboardGetJoi(keyboardGetParams);

      if (keyboardGetRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong keyboardGetJoi response
        keyboardGetParams: ${JSON.stringify(keyboardGetParams, null, 3)}
        keyboardGetRaw: ${JSON.stringify(keyboardGetRaw, null, 3)}`);
      }

      const keyboards = keyboardGetRaw.payload;

      if (currentAccount.keyboard != null) {

        let splitKeyboardRes = _.split(currentAccount.keyboard, sails.config.custom.JUNCTION, 2);
        let keyboardBlock = splitKeyboardRes[0];
        let keyboardId = splitKeyboardRes[1];

        if (keyboardBlock == null || keyboardId == null) {

          throw new Error(`${moduleName}, error: account.keyboard parsing error:
        currentAccount.keyboard: ${currentAccount.keyboard}
        keyboardBlock: ${keyboardBlock}
        keyboardId: ${keyboardId}`);

        }

        const activeKeyboard = _.find(keyboards[keyboardBlock], {id: keyboardId});

        if (activeKeyboard == null) {
          throw new Error(`${moduleName}, error: keyboard not found:
          keyboards: ${JSON.stringify(keyboards, null, 3)}
          keyboardBlock: ${keyboardBlock}
          keyboardId: ${keyboardId}`);
        }

        const sendKeyboardParams = {
          client: input.client,
          messageData: activeKeyboard.message,
          keyboardData: activeKeyboard.buttons,
          additionalTokens: input.additionalTokens,
        };

        const sendKeyboardJoiRaw = await sails.helpers.keyboardProcessor.sendKeyboardJoi(sendKeyboardParams);

        if (sendKeyboardJoiRaw.status !== 'ok') {
          throw new Error(`${moduleName}, error: wrong sendKeyboardJoi response
        sendKeyboardParams: ${JSON.stringify(sendKeyboardParams, null, 3)}
        sendKeyboardJoiRaw: ${JSON.stringify(sendKeyboardJoiRaw, null, 3)}`);
        }

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

