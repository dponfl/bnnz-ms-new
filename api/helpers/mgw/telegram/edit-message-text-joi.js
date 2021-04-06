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

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      let optionalParams = {
        parse_mode: 'HTML',
      };

      if (input.optionalParams != null) {
        optionalParams = _.assign(optionalParams, input.optionalParams);
      }

      const editTextMessageRes = await sails.config.custom.telegramBot.editMessageText(
        input.html,
        optionalParams,
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram message was edited',
        payload: editTextMessageRes,
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
          payload: {},
        });
      }

    }

  }


};

