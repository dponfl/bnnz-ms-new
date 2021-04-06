"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:keyboard-remove-joi';

module.exports = {


  friendlyName: 'Remove keyboard',


  description: 'Remove keyboard',


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

    const schema = Joi.object({
      chatId: Joi
        .string()
        .description('client chat id we use to send message')
        .required(),
      html: Joi
        .string()
        .description('html code of the message')
        .required(),
      disableWebPagePreview: Joi
        .boolean()
        .description('flag to disable web page preview at message')
        .default(false),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const disable_web_page_preview = input.disableWebPagePreview;

      const sendMessageRes = await sails.config.custom.telegramBot.sendMessage(
        input.chatId,
        input.html,
        {
          parse_mode: 'HTML',
          disable_web_page_preview,
          reply_markup: {
            remove_keyboard: true,
          }
        }
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram keyboard was removed',
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

