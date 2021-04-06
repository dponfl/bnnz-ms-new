"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:inline-keyboard-message-joi';

module.exports = {


  friendlyName: 'Inline keyboard message Telegram',


  description: 'Send inline keyboard message on Telegram messenger',


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
      inlineKeyboard: Joi
        .any()
        .description('inline keyboard of the message')
        .required(),
      disableWebPagePreview: Joi
        .boolean()
        .description('flag to disable web page preview at message'),
      removeKeyboard: Joi
        .boolean()
        .description('flag to remove the current keyboard'),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const disable_web_page_preview = input.disableWebPagePreview || false;

      let optionalParams = {
        parse_mode: 'HTML',
        disable_web_page_preview,
        reply_markup: {
          inline_keyboard: input.inlineKeyboard,
        }
      };

      if (input.removeKeyboard) {
        optionalParams.reply_markup.remove_keyboard = true;
      }

      const sendMessageRes = await sails.config.custom.telegramBot.sendMessage(
        input.chatId,
        input.html,
        optionalParams,
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram inline keyboard message was sent',
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

