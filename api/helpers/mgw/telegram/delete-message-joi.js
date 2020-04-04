"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:delete-message-joi';

module.exports = {


  friendlyName: 'Delete message',


  description: 'Deletes message on Telegram messenger',


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

  },


  fn: async function (inputs, exits) {

    const schema = Joi.object({
      chatId: Joi
              .string()
              .description('client chat id we use to send message')
              .required(),
      messageId: Joi
            .string()
            .description('Unique identifier of the target message')
            .required(),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      let deleteMessageRes = await sails.config.custom.telegramBot.deleteMessage(
        input.chatId,
        input.messageId,
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram message was deleted',
        payload: deleteMessageRes,
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

