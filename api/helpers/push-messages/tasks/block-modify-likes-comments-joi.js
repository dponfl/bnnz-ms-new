"use strict";

const Joi = require('@hapi/joi');

const uuid = require('uuid-apikey');

const moduleName = 'push-messages:tasks:block-modify-likes-comments-joi';

module.exports = {


  friendlyName: 'push-messages:tasks:block-modify-likes-comments-joi',


  description: 'push-messages:tasks:block-modify-likes-comments-joi',


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
        taskGuid: Joi
          .string()
          .guid()
          .required(),
      }).required(),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      let resBlock = input.messageData;
      let messageInlineKeyboard = resBlock.message.inline_keyboard || [];

      if (!uuid.isUUID(input.additionalParams.taskGuid)) {
        throw new Error(`Received input.additionalParams.taskGuid is not a valid UUID: ${input.additionalParams.taskGuid}`);
      }

      messageInlineKeyboard = _.concat(messageInlineKeyboard, [[
        {
          "text": "MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_lc_" + input.additionalParams.taskGuid
        }
      ]]);

      resBlock.message.inline_keyboard = messageInlineKeyboard;

      return exits.success(resBlock);

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

