"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:simple-message-joi';

module.exports = {


  friendlyName: 'Simple message Telegram',


  description: 'Send simple text message on Telegram messenger',


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
      html: Joi
        .string()
        .description('html code of the message')
        .required(),
      disableWebPagePreview: Joi
        .boolean()
        .description('flag to disable web page preview at message'),
      removeKeyboard: Joi
        .boolean()
        .description('flag to remove the current keyboard'),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      const disable_web_page_preview = input.disableWebPagePreview || false;

      let optionalParams = {
        parse_mode: 'HTML',
        disable_web_page_preview,
      };

      if (input.removeKeyboard) {
        optionalParams.reply_markup = {
          remove_keyboard: true,
        }
      }

      let sendMessageRes = await sails.config.custom.telegramBot.sendMessage(
        input.chatId,
        input.html,
        optionalParams,
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram simple message was sent',
        payload: sendMessageRes,
      })

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

      // TODO: В errorPayloadAdditional добавить input.chatId

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

