"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:client-get-by-criteria-joi';


module.exports = {


  friendlyName: 'storage:client-get-by-criteria-joi',


  description: 'storage:client-get-by-criteria-joi',


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
      criteria: Joi
        .any()
        .description('search criteria')
        .required(),
    });

    let input;
    let clientsArray = [];

    try {

      input = await schema.validateAsync(inputs.params);

      const clientRecs = await Client.find({
        where: input.criteria,
      })
        .tolerate(async (err) => {

          err.details = {
            where: input.criteria,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Client.find() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              where: input.criteria,
            },
          });

          return [];
        });

      for (const client of clientRecs) {

        const accountRecordsRaw = await sails.helpers.storage.accountGetJoi({
          clientId: client.id,
        });

        const accountRecords = accountRecordsRaw.payload;

        const clientWithAccounts = _.assignIn(client, {accounts: accountRecords});

        clientsArray.push(clientWithAccounts);

      }




      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: clientsArray, // array of record objects of empty array
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

