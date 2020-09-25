"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:generic:options:callback-be-free-commercial-info-joi';


module.exports = {


  friendlyName: 'funnel:generic:options:callback-be-free-commercial-info-joi',


  description: 'funnel:generic:options:callback-be-free-commercial-info-joi',


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
      query: Joi
        .any()
        .description('Callback query received')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;

    let client;


    let switchFunnelToAnyBlockParams;


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;

      clientGuid = client.guid;
      accountGuid = client.account_use;


      switch (input.query.data) {
        case 'funnel_befree_c':

          switchFunnelToAnyBlockParams = {
            client,
            serviceName: 'test_commercial_initial',
            funnelName: 'optin',
            blockId: 'intro',
            skipBlocks: [
              {
                id: 'start_sticker',
                initial: true,
                previous: null,
                next: 'optin::start',
                switchToFunnel: null,
              },
              {
                id: 'start',
                previous: 'optin::start_sticker',
                next: 'optin::five_days',
                switchToFunnel: null,
              },
              {
                id: 'five_days',
                previous: 'optin::start',
                next: 'optin::conditions',
                switchToFunnel: null,
              },
              {
                id: 'conditions',
                previous: 'optin::five_days',
                next: 'optin::intro',
                switchToFunnel: null,
              },
            ],
            proceedNextBlock: false,
            createdBy: moduleName,
          };

          await sails.helpers.funnel.switchFunnelToAnyBlockJoi(switchFunnelToAnyBlockParams);

          break;
        case 'select_account_type':

          switchFunnelToAnyBlockParams = {
            client,
            serviceName: 'generic',
            funnelName: 'options',
            blockId: 'select_personal_or_commercial',
            skipBlocks: [
              {
                id: 'start',
                initial: true,
                previous: null,
                next: 'options::intro',
                switchToFunnel: null,
              },
              {
                id: 'intro',
                previous: 'options::start',
                next: 'options::intro_video',
                switchToFunnel: null,
              },
              {
                id: 'intro_video',
                previous: 'options::intro',
                next: 'options::select_personal_or_commercial',
                switchToFunnel: null,
              },
            ],
            proceedNextBlock: false,
            createdBy: moduleName,
          };

          await sails.helpers.funnel.switchFunnelToAnyBlockJoi(switchFunnelToAnyBlockParams);

          break;
        default:
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Wrong callback data',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              inputQueryData: input.query.data,
            },
          });
      }

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

