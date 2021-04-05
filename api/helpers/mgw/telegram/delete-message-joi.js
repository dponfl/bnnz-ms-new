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

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const deleteMessageRes = await sails.config.custom.telegramBot.deleteMessage(
        input.chatId,
        input.messageId,
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram message was deleted',
        payload: deleteMessageRes,
      })

    } catch (e) {

      const throwError = false;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            chatId: input.chatId,
            messageId: input.messageId,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            chatId: input.chatId,
            messageId: input.messageId,
          },
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }


};

