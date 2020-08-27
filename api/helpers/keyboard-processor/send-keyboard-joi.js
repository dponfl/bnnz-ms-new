"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboard-processor:send-keyboard-joi';


module.exports = {


  friendlyName: 'keyboard-processor:send-keyboard-joi',


  description: 'keyboard-processor:send-keyboard-joi',


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

    const schema = Joi
      .object({
        client: Joi
          .any()
          .required(),
        keyboard: Joi
          .any()
          .required(),
        messageData: Joi
          .any()
          .required(),
        keyboardData: Joi
          .any()
          .required(),
        additionalTokens: Joi
          .any(),
        additionalData: Joi
          .any()
          .description('additional data to pass to beforeHelper'),
        disableWebPagePreview: Joi
          .boolean()
          .description('flag to disable web page preview at message'),
      });

    let input;

    let clientGuid;
    let accountGuid;

    let res;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const htmlSimpleRaw = await KeyboardProcessor.parseMessageStyle({
        client: input.client,
        message: input.messageData,
        additionalTokens: input.additionalTokens,
      });

      let {text: htmlSimple} = await activateBeforeHelper(input.client, input.keyboard, htmlSimpleRaw, input.additionalData);

      const keyboard = await KeyboardProcessor.mapButtonsDeep({
        client: input.client,
        buttons: input.keyboardData,
      });

      const keyboardType = _.get(input.keyboard, 'actionType', null);

      if (keyboardType == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Keyboard has no actionType',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.KEYBOARD_PROCESSOR_ERROR.name,
          payload: {
            keyboard: input.keyboard,
            keyboardType,
          },
        });
      }

      switch (keyboardType) {
        case 'show_keyboard':
          res = await sails.helpers.mgw.telegram.keyboardMessageJoi({
            chatId: input.client.chat_id,
            html: htmlSimple,
            keyboard,
          });
          break;

        case 'delete_keyboard':
          res = await sails.helpers.mgw.telegram.keyboardRemoveJoi({
            chatId: input.client.chat_id,
            html: htmlSimple,
          });
          break;

        default:
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Unknown keyboard actionType',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.KEYBOARD_PROCESSOR_ERROR.name,
            payload: {
              keyboard: input.keyboard,
              keyboardType,
            },
          });
      }


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: res,
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
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          }
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          }
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};

async function activateBeforeHelper(client, keyboard, htmlMsg, data) {

  let keyboardName;

  let res = {
    text: htmlMsg,
  };

  if (!_.isNil(keyboard.beforeHelper)) {

    let splitBeforeHelperRes = _.split(keyboard.beforeHelper, sails.config.custom.JUNCTION, 2);
    let beforeHelperBlock = splitBeforeHelperRes[0];
    let beforeHelperName = splitBeforeHelperRes[1];

    if (beforeHelperBlock && beforeHelperName) {

      /**
       * We managed to parse the specified beforeHelper and can perform it
       */

      let beforeHelperParams = {
        client: client,
        keyboard,
        payload: res,
      };

      if (data != null) {
        beforeHelperParams.additionalData = data;
      }

      const currentAccount = _.find(client.accounts, {guid: client.account_use});

      keyboardName = currentAccount.service.keyboard_name;

      res = await sails.helpers.keyboards[keyboardName][beforeHelperBlock][beforeHelperName](beforeHelperParams);

    } else {

      /**
       * Throw error: we could not parse the specified beforeHelper
       */

      // throw new Error(sails.config.custom.PROCEED_NEXT_BLOCK_BEFOREHELPER_PARSE_ERROR);

      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
        location: moduleName,
        message: 'could not parse the specified beforeHelper',
        clientGuid: client.guid,
        accountGuid: client.account_use,
        errorName: sails.config.custom.KEYBOARDS_ERROR.name,
        payload: {
          blockBeforeHelper: keyboard.beforeHelper,
        },
      });

    }

  }

  return res;

}


