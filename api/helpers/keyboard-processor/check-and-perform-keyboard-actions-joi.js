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

    let clientGuid;
    let accountGuid;


    let keyboards;
    let activeKeyboard;
    let keyboardName;

    let pushMessage;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

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

        // throw new Error(`${moduleName}, error: service has no keyboard_name:
        // (currentAccount.service: ${JSON.stringify(currentAccount.service, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Service has no keyboard_name',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.KEYBOARD_PROCESSOR_ERROR.name,
          payload: {
            service: currentAccount.service,
          },
        });

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
        // throw new Error(`${moduleName}, error: wrong keyboardGetJoi response
        // keyboardGetParams: ${JSON.stringify(keyboardGetParams, null, 3)}
        // keyboardGetRaw: ${JSON.stringify(keyboardGetRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong keyboardGetJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.KEYBOARD_PROCESSOR_ERROR.name,
          payload: {
            keyboardGetParams,
            keyboardGetRaw,
          },
        });

      }

      keyboards = keyboardGetRaw.payload;

      let splitKeyboardRes = _.split(currentAccount.keyboard, sails.config.custom.JUNCTION, 2);
      let keyboardBlock = splitKeyboardRes[0];
      let keyboardId = splitKeyboardRes[1];

      if (keyboardBlock == null || keyboardId == null) {

        // throw new Error(`${moduleName}, error: account.keyboard parsing error:
        // currentAccount.keyboard: ${currentAccount.keyboard}
        // keyboardBlock: ${keyboardBlock}
        // keyboardId: ${keyboardId}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'account.keyboard parsing error',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.KEYBOARD_PROCESSOR_ERROR.name,
          payload: {
            keyboardId,
            keyboardBlock,
            currentAccountKeyboard: currentAccount.keyboard,
          },
        });

      }

      activeKeyboard = _.find(keyboards[keyboardBlock], {id: keyboardId});

      if (activeKeyboard == null) {
        // throw new Error(`${moduleName}, error: keyboard not found:
        //   keyboards: ${JSON.stringify(keyboards, null, 3)}
        //   keyboardBlock: ${keyboardBlock}
        //   keyboardId: ${keyboardId}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'keyboard not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.KEYBOARD_PROCESSOR_ERROR.name,
          payload: {
            keyboardId,
            keyboardBlock,
            keyboards,
          },
        });

      }

      const buttonsAndActions = await KeyboardProcessor.parseButtonActions({
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

        /**
         * Достаём данные PushMessage
         */

        const pushMessageName = currentAccount.service.push_message_name;

        const pushMessageGetParams = {
          pushMessageName,
        };

        const pushMessageGetRaw = await sails.helpers.storage.pushMessageGetJoi(pushMessageGetParams);

        if (pushMessageGetRaw.status !== 'ok') {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Wrong pushMessageGetJoi response',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.STORAGE_ERROR.name,
            payload: {
              pushMessageGetParams,
              pushMessageGetRaw,
            },
          });

        }

        pushMessage = pushMessageGetRaw.payload;

        const messageDataPath = 'keyboards.wrongMessage';
        const messageData = _.get(pushMessage, messageDataPath, null);

        if (messageData == null) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'No expected messageData',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.STORAGE_ERROR.name,
            payload: {
              pushMessage,
              messageDataPath,
              messageData,
            },
          });
        }

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

          let actionHelperRes = _.split(activatedButton.action, sails.config.custom.JUNCTION, 3);
          let actionHelperCategory = actionHelperRes[0];
          let actionHelperBlock = actionHelperRes[1];
          let actionHelperName = actionHelperRes[2];

          if (actionHelperCategory && actionHelperBlock && actionHelperName) {

            /**
             * We managed to parse the specified actionHelper and can perform it
             */

            let actionHelperParams = {
              client: input.client,
            };

            await sails.helpers.keyboards[actionHelperCategory][actionHelperBlock][actionHelperName](actionHelperParams);

          } else {

            /**
             * Throw error: we could not parse the specified actionHelper
             */

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Cannot parse action helper',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.KEYBOARD_PROCESSOR_ERROR.name,
              payload: {
                activatedButtonAction: activatedButton.action,
              },
            });

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

