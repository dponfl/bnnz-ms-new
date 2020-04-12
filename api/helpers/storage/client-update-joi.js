"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:client-update-joi';


module.exports = {


  friendlyName: 'Client update',


  description: 'Update record for the existing client',


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
        .description('Criteria to update client record')
        .required(),
      data: Joi
        .any()
        .description('Data to update to the client record')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const accounts = _.get(input.data, 'accounts');

      _.forEach(accounts, async (acc) => {

        await sails.helpers.storage.accountUpdate.with({
          criteria: {id: acc.id},
          data: acc,
        })
      });

      const clientRec = await Client.findOne({
        where: input.criteria,
      });

      if (clientRec != null) {
        await sails.helpers.storage.clientFieldsPut.with({
          clientGuid: clientRec.guid,
          data: input.data,
        })
      }

      await Client.update(input.criteria).set(_.omit(input.data, 'accounts'));

      return exits.success({
        status: 'ok',
        message: 'Client updated',
        payload: {
          criteria: input.criteria,
          client: input.data
        },
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

