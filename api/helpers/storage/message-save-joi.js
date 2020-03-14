"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

module.exports = {


  friendlyName: 'Message save',


  description: 'Save all communication between client and bot',


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

    let messageRec;

    const schema = Joi.object({
      message: Joi
        .string()
        .required(),
      callback_query_id: Joi
        .string()
        .max(255)
        .required(),
      message_id: Joi
        .number()
        .integer()
        .allow(0),
      message_format: Joi
        .string()
        .max(255)
        .valid(
          sails.config.custom.enums.messageFormat.SIMPLE,
          sails.config.custom.enums.messageFormat.CALLBACK,
          sails.config.custom.enums.messageFormat.FORCED,
          sails.config.custom.enums.messageFormat.IMG,
          sails.config.custom.enums.messageFormat.VIDEO,
          sails.config.custom.enums.messageFormat.POSTBROADCAST,
          sails.config.custom.enums.messageFormat.PUSHSIMPLE,
          sails.config.custom.enums.messageFormat.PUSHCALLBACK,
          sails.config.custom.enums.messageFormat.PUSHFORCED,
          sails.config.custom.enums.messageFormat.PUSHIMG,
          sails.config.custom.enums.messageFormat.PUSHVIDEO
        )
        .required(),
      messenger: Joi
        .string()
        .max(50)
        .valid(sails.config.custom.enums.messenger.TELEGRAM)
        .required(),
      message_originator: Joi
        .string()
        .max(50)
        .valid(
          sails.config.custom.enums.messageOriginator.BOT,
          sails.config.custom.enums.messageOriginator.CLIENT,
        )
        .required(),
      client_id: Joi
        .number()
        .integer()
        .required(),
      client_guid: Joi
        .string()
        .guid()
        .required(),
      message_buttons: Joi.any(),
    });

    try {

      const input = await schema.validateAsync(inputs.params);
      const uuidApiKey = uuid.create();

      messageRec = {
        message_guid: uuidApiKey.uuid,
        client_id: input.client_id,
        client_guid: input.client_guid,
        callback_query_id: input.callback_query_id,
        message: input.message,
        message_format: input.message_format,
        message_buttons: input.message_buttons || {},
        messenger: input.messenger,
        message_originator: input.message_originator,
      };

      await Messages.create(messageRec);

      return exits.success({
        status: 'ok',
        message: 'Message record created',
        payload: messageRec,
      })

    } catch (e) {

      const errorLocation = 'api/helpers/storage/message-save-joi';
      const errorMsg = sails.config.custom.MESSAGESAVE_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
            messageRec: messageRec,
          },
        }
      };
    }

  }


};

