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

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const editMessageReplyMarkupRes = await sails.config.custom.telegramBot.editMessageReplyMarkup(
        input.replyMarkup,
        input.optionalParams,
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram message reply markup was edited',
        payload: editMessageReplyMarkupRes,
      })

    } catch (e) {

      const throwError = false;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            optionalParams: input.optionalParams,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            optionalParams: input.optionalParams,
          },
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {
            error: e,
          },
        });
      }

    }

  }


};

