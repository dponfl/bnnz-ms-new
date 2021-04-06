"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:sticker-message-joi';

module.exports = {


  friendlyName: 'Sticker message Telegram',


  description: 'Send sticker message on Telegram messenger',


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
    },

  },


  fn: async function (inputs, exits) {

    // sails.log.info('Telegram video message: ', inputs);

    const schema = Joi.object({
      chatId: Joi
        .string()
        .description('client chat id we use to send message')
        .required(),
      stickerPath: Joi
        .string()
        .description('sticker url')
        .uri()
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const sendMessageRes = await sails.config.custom.telegramBot.sendSticker(
        input.chatId,
        input.stickerPath,
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram sticker message was sent',
        payload: sendMessageRes,
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
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            chatId: input.chatId,
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

