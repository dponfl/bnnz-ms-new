"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:edit-message-reply-markup-joi';

module.exports = {


  friendlyName: 'Edit message reply markup Telegram',


  description: 'Edit message reply markup on Telegram messenger',


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
      replyMarkup: Joi
            .any()
            .description('object for an inline keyboard')
            .required(),
      optionalParams: Joi
            .any()
            .description('optional parameters')
            .required(),
    });

    try {

      const input = await schema.validateAsync(inputs.params);

      let editMessageReplyMarkupRes = await sails.config.custom.telegramBot.editMessageReplyMarkup(
        input.replyMarkup,
        input.optionalParams,
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram message reply markup was edited',
        payload: editMessageReplyMarkupRes,
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

