"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:doc-message-joi';

module.exports = {


  friendlyName: 'Document message Telegram',


  description: 'Send document message on Telegram messenger',


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
      docPath: Joi
        .string()
        .description('document url')
        .uri()
        .required(),
      html: Joi
        .string()
        .description('html code of the doc message'),
      inlineKeyboard: Joi
        .any()
        .description('inline keyboard for the doc message')
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      let messageObj = {
        parse_mode: 'HTML'
      };

      if (input.html) {
        messageObj.caption = input.html;
      }

      if (input.inlineKeyboard) {
        messageObj.reply_markup = {
          inline_keyboard: input.inlineKeyboard,
        };
      }

      const sendMessageRes = await sails.config.custom.telegramBot.sendDocument(
        input.chatId,
        input.docPath,
        messageObj
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram doc message was sent',
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
            docPath: input.docPath,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            chatId: input.chatId,
            docPath: input.docPath,
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

