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

      await Client.update(inputs.criteria).set(inputs.data);

      return exits.success({
        status: 'ok',
        message: 'Client record updated',
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
            criteria: inputs.criteria,
            client: inputs.client,
            error: e.message || 'no error message',
          }
        }
      };

    }

  }


};

