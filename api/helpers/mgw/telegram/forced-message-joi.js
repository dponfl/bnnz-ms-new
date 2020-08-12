"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:forced-message-joi';

module.exports = {


  friendlyName: 'Forced message Telegram',


  description: 'Send forced text message on Telegram messenger',


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

    // sails.log.info('Telegram forced message: ', inputs);

    const schema = Joi.object({
      chatId: Joi
        .string()
        .description('client chat id we use to send message')
        .required(),
      html: Joi
        .string()
        .description('html code of the message')
        .required(),
      removeKeyboard: Joi
        .boolean()
        .description('flag to remove the current keyboard'),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      let optionalParams = {
        parse_mode: 'HTML',
        reply_markup: {
          force_reply: true
        }
      };

      if (input.removeKeyboard) {
        optionalParams.reply_markup.remove_keyboard = true;
      }

      let sendMessageRes = await sails.config.custom.telegramBot.sendMessage(
        input.chatId,
        input.html,
        optionalParams,
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram forced message was sent',
        payload: sendMessageRes,
      })

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: ${sails.config.custom.FORCED_MESSAGE_SEND_ERROR}`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {
      //   err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

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

