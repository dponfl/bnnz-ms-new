"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:client-journey-create-joi';


module.exports = {


  friendlyName: 'storage:client-journey-create-joi',


  description: 'Create client journey record',


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
      clientGuid: Joi
        .string()
        .description('client guid')
        .guid()
        .required(),
      accountGuid: Joi
        .string()
        .description('account guid')
        .guid()
        .required(),
      funnelName: Joi
        .string()
        .description('funnel name')
        .required(),
      blockId: Joi
        .string()
        .description('funnel block id')
        .required(),
    });

    let clientGuid;
    let accountGuid;

    try {

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.clientGuid;
      accountGuid = input.accountGuid;


      const uuidApiKey = uuid.create();

      const clientJourneyRec = {
        guid: uuidApiKey.uuid,
        clientGuid: input.clientGuid,
        accountGuid: input.accountGuid,
        funnelName: input.funnelName,
        blockId: input.blockId,
      };

      await ClientJourney.create(clientJourneyRec)
        .tolerate(async (err) => {

          err.details = {
            clientJourneyRec,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'ClientJourney.create() error',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              clientJourneyRec,
            },
          });

          return true;
        });

      return exits.success({
        status: 'ok',
        message: 'ClientJourney record created',
        payload: clientJourneyRec,
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

