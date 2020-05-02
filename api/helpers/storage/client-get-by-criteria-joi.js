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

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};

