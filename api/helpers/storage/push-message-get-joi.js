"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'message-processor:push-message-get-joi';


module.exports = {


  friendlyName: 'message-processor:push-message-get-joi',


  description: 'Fetch push messages data from push_messages table',


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
    }
  },


  fn: async function (inputs, exits) {

    const schema = Joi.object({
      pushMessageName: Joi
        .string()
        .description('pushMessage name')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const pushMessages = await PushMessages.findOne({
        active: true,
        name: input.pushMessageName,
      });

      if (pushMessages.message_data != null) {

        return exits.success({
          status: 'ok',
          message: 'Push message data received',
          payload: pushMessages.message_data,
        })

      } else {

        return exits.success({
          status: 'nok',
          message: 'Push message data NOT received',
          payload: {},
        })

      }

    } catch (e) {
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

