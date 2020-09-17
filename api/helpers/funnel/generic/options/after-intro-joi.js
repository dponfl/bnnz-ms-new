"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:generic:options:after-intro-joi';


module.exports = {


  friendlyName: 'funnel:generic:options:after-intro-joi',


  description: 'funnel:generic:options:after-intro-joi',


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

    let client;


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;

      clientGuid = client.guid;
      accountGuid = client.account_use;

      const switchFunnelToAnyBlockParams = {
        client,
        clientCategory: 'testPersonal',
        funnelName: 'optin',
        blockId: 'intro',
        skipBlocks: ['start_sticker', 'start', 'five_days', 'conditions'],
        createdBy: moduleName,
      };

      const switchFunnelRaw = await sails.helpers.funnel.switchFunnelToAnyBlockJoi(switchFunnelToAnyBlockParams);

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {switchFunnelRaw},
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
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
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

