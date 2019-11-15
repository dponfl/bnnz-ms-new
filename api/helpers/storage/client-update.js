"use strict";

module.exports = {


  friendlyName: 'Client update',


  description: 'Update record for the existing client',


  inputs: {

    criteria: {
      friendlyName: 'criteria',
      description: 'Criteria to update client record',
      type: 'ref',
      required: true,
    },

    data: {
      friendlyName: 'data',
      description: 'Data to update to the client record',
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

    try {

      // sails.log.debug('*** storage:clientUpdate, inputs: ', inputs);

      const accounts = _.get(inputs.data, 'accounts');

      // sails.log.debug('*** storage:clientUpdate, accounts: ', accounts);


      _.forEach(accounts, async (acc) => {
        // await Account.update(acc.id).set(acc);

        // sails.log.debug('*** storage:clientUpdate, acc: ', acc);

        await sails.helpers.storage.accountUpdate.with({
          criteria: {id: acc.id},
          data: acc,
        })
      });

      const clientRec = await Client.findOne({
        where: inputs.criteria,
      });

      if (clientRec != null) {
        await sails.helpers.storage.clientFieldsPut.with({
          clientGuid: clientRec.guid,
          data: inputs.data,
        })
      }

      await Client.update(inputs.criteria).set(_.omit(inputs.data, 'accounts'));

      return exits.success({
        status: 'ok',
        message: 'Client updated',
        payload: {
          criteria: inputs.criteria,
          client: inputs.data
        },
      })

    } catch (e) {

      const errorLocation = 'api/helpers/storage/client-update';
      const errorMsg = sails.config.custom.CLIENTUPDATE_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

  }


};

