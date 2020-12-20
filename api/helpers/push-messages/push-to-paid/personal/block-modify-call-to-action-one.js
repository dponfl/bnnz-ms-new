"use strict";

const Joi = require('@hapi/joi');

const uuid = require('uuid-apikey');

const moduleName = 'push-messages:push-to-paid:personal:block-modify-call-to-action-one';

module.exports = {


  friendlyName: 'push-messages:push-to-paid:personal:block-modify-call-to-action-one',


  description: 'push-messages:push-to-paid:personal:block-modify-call-to-action-one',


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
      client: Joi.any().required(),
      messageData: Joi.any().required(),
      additionalParams: Joi.object({
        chatBlastGuid: Joi
          .string()
          .guid()
          .required(),
        elementId: Joi
          .string()
          .required(),
      }).required(),
    });

    let clientGuid;
    let accountGuid;


    try {

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      let resBlock = input.messageData;

      if (!uuid.isUUID(input.additionalParams.chatBlastGuid)) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'input.additionalParams.chatBlastGuid is not a valid UUID',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
          payload: {
            taskGuid: input.additionalParams.chatBlastGuid,
          },
        });
      }

      // TODO: Сформировть "callback_data" таким образом, чтобы callback-обработчик
      //  мог из них получить:
      //  guid записи ChatBlastsPerformance
      //  id элемента в этой серии Chat Blasts
      //  идентификатор кнопки этого элемента
      //  ВАЖНО: "callback_data" не должна превышать 64 символов
      //  поэтому суммарная длина "elementId" и "rootCallbackData"
      //  должна быть не более 14 символов

      const rootCallbackData = resBlock.message.inline_keyboard[0][0].callback_data;

      resBlock.message.inline_keyboard[0][0].callback_data = `push_msg_cb_${input.additionalParams.chatBlastGuid}_${input.additionalParams.elementId}_${rootCallbackData}`;

      return exits.success(resBlock);

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

