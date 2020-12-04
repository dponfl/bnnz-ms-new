"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:common:ref-profile-subscription-check:after-join-ref-check-error-joi';


module.exports = {


  friendlyName: 'funnel:common:ref-profile-subscription-check:after-join-ref-check-error-joi',


  description: 'funnel:common:ref-profile-subscription-check:after-join-ref-check-error-joi',


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
      client: Joi
        .any()
        .description('Client record')
        .required(),
      block: Joi
        .any()
        .description('Current funnel block')
        .required(),
      msg: Joi
        .any()
        .description('Message received'),
    });

    let input;

    let clientGuid;
    let accountGuid;



    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const moveToKeyboardGenericParams = {

        client: input.client,
        block: input.block,
        keyboardName: 'home::start',
        afterHelperNext: false,
        msg: input.msg,
        createdBy: moduleName,

      };

      await sails.helpers.funnel.moveToKeyboardGenericJoi(moveToKeyboardGenericParams);

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
            input,
          }
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
            input,
          }
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

