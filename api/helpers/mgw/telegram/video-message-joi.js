"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:video-message-joi';

module.exports = {


  friendlyName: 'Video message Telegram',


  description: 'Send video message on Telegram messenger',


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
      videoPath: Joi
        .string()
        .description('video url')
        .uri()
        .required(),
      html: Joi
        .string()
        .description('html code of the message'),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      let messageObj = {
        parse_mode: 'HTML'
      };

      if (input.html) {
        messageObj.caption = input.html;
      }

      let sendMessageRes = await sails.config.custom.telegramBot.sendVideo(
        input.chatId,
        input.videoPath,
        messageObj
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram video message was sent',
        payload: sendMessageRes,
      })

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: ${sails.config.custom.VIDEO_MESSAGE_SEND_ERROR}`;
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

