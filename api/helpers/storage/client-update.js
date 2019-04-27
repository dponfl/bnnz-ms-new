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

      const accounts = _.get(inputs.data, 'accounts');

      _.forEach(accounts, async (acc) => {
        // await Account.update(acc.id).set(acc);
        await sails.helpers.storage.accountUpdate.with({
          criteria: {id: acc.id},
          data: acc,
        })
      });

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

      throw {err: {
          module: 'api/helpers/storage/client-update',
          message: sails.config.custom.CLIENTUPDATE_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

  }


};

