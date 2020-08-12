"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:edit-message-text-joi';

module.exports = {


  friendlyName: 'Edit text message Telegram',


  description: 'Edit text message on Telegram messenger',


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

    // sails.log.info('Telegram simple message: ', inputs);

    const schema = Joi.object({
      html: Joi
        .string()
        .description('html code of the message')
        .required(),
      optionalParams: Joi
        .any()
        .description('optional parameters')
        .required(),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      let editTextMessageRes = await sails.config.custom.telegramBot.editMessageText(
        input.html,
        input.optionalParams,
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram message was edited',
        payload: editTextMessageRes,
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

