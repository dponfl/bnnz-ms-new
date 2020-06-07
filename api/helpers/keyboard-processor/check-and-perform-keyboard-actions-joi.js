"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboard-processor:check-and-perform-keyboard-actions-joi';


module.exports = {


  friendlyName: 'keyboard-processor:check-and-perform-keyboard-actions-joi',


  description: 'keyboard-processor:check-and-perform-keyboard-actions-joi',


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
      text: Joi
        .string()
        .description('message text')
        .required(),
    });

    let input;

    let keyboards;
    let activeKeyboard;
    let keyboardName;

    try {

      input = await schema.validateAsync(inputs.params);

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      if (currentAccount.keyboard == null) {

        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {
            keyboardInUse: false,
          },
        })

      }

      if (currentAccount.service.keyboard_name == null) {

        throw new Error(`${moduleName}, error: service has no keyboard_name:
        (currentAccount.service: ${JSON.stringify(currentAccount.service, null, 3)}`);

      }

      keyboardName = currentAccount.service.keyboard_name;

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

      keyboards = keyboardGetRaw.payload;

      let splitKeyboardRes = _.split(currentAccount.keyboard, sails.config.custom.JUNCTION, 2);
      let keyboardBlock = splitKeyboardRes[0];
      let keyboardId = splitKeyboardRes[1];

      if (keyboardBlock == null || keyboardId == null) {

        throw new Error(`${moduleName}, error: account.keyboard parsing error:
        currentAccount.keyboard: ${currentAccount.keyboard}
        keyboardBlock: ${keyboardBlock}
        keyboardId: ${keyboardId}`);

      }

      activeKeyboard = _.find(keyboards[keyboardBlock], {id: keyboardId});

      if (activeKeyboard == null) {
        throw new Error(`${moduleName}, error: keyboard not found:
          keyboards: ${JSON.stringify(keyboards, null, 3)}
          keyboardBlock: ${keyboardBlock}
          keyboardId: ${keyboardId}`);
      }

      const buttonsAndActions = KeyboardProcessor.parseButtonActions({
        client: input.client,
        buttons: activeKeyboard.buttons,
      });

      const activatedButton = _.find(buttonsAndActions, {text: input.text});

      if (activatedButton == null) {

        /**
         * Получено сообщение, которого нет в активной клавиатуре
         * Отправить клиенту сообщение о необходимости использовать клавиатуру
         * Впоследствии это сообщение нужно будет передавать в Службу поддержки
         */

        // TODO: Передать полученное сообщение в Службу поддержки

        const messageData = {
          "id": "wrong_message",
          "description": "",
          "actionType": "text",
          "beforeHelper": null,
          "afterHelper": null,
          "forcedHelper": null,
          "callbackHelper": null,
          "blockModifyHelper": null,
          "message": {
          "html": [
            {
              "text": "BEHERO_GENERAL_USE_KEYBOARD",
              "style": "b",
              "cr": ""
            }
          ]
        }
        };

        const msgRes = await sails.helpers.messageProcessor.sendMessageJoi({
          client: input.client,
          messageData,
        });


      } else {

        /**
         * Получено сообщение, отправленное с использованием специальной клавиатуры
         * Необходимо выполнить действия, соответствующие этой клавише
         */

        if (activatedButton.action != null) {

          let actionHelperRes = _.split(activatedButton.action, sails.config.custom.JUNCTION, 2);
          let actionHelperBlock = actionHelperRes[0];
          let actionHelperName = actionHelperRes[1];

          if (actionHelperBlock && actionHelperName) {

            /**
             * We managed to parse the specified actionHelper and can perform it
             */

            let actionHelperParams = {
              client: input.client,
            };

            await sails.helpers.keyboards[keyboardName][actionHelperBlock][actionHelperName](actionHelperParams);

          } else {

            /**
             * Throw error: we could not parse the specified actionHelper
             */

            throw new Error(`${moduleName}, error: could not parse action helper:
          activatedButton.action: ${activatedButton.action}`);
          }

        }

      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          keyboardInUse: true,
        },
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

