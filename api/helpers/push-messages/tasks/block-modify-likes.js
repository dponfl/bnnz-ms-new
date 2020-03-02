"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'push-messages:tasks:block-modify-likes';

module.exports = {


  friendlyName: 'push-messages:tasks:block-modify-likes',


  description: 'push-messages:tasks:block-modify-likes',


  inputs: {
    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    block: {
      friendlyName: 'block',
      description: 'Current message block',
      type: 'ref',
      required: true,
    },
    taskGuid: {
      friendlyName: 'task guid',
      description: 'task guid',
      type: 'string',
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

    let resBlock = inputs.block;
    let messageInlineKeyboard = [];

    try {

      if (!uuid.isUUID(inputs.taskGuid)) {
        throw new Error(`Received inputs.taskGuid is not a valid UUID: ${inputs.taskGuid}`);
      }

      messageInlineKeyboard = _.concat(messageInlineKeyboard, [[
        {
          "text": "MSG_TASK_PERFORM_BTN",
          "callback_data": "push_msg_tsk_l_" + inputs.taskGuid
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
          payload: {},
        }
      };
    }
  }
};

