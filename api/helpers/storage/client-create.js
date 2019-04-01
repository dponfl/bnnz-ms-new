module.exports = {


  friendlyName: 'Client create',


  description: 'Create new record for the client',


  inputs: {

    client: {
      friendlyName: 'client',
      description: 'Client record',
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

      const client = await Client.create(inputs.client).fetch();
      const room = await sails.helpers.general.getRoom();
      await Client.addToCollection(client.id, 'room', )

      return exits.success({
        status: 'ok',
        message: 'Client record created',
        payload: client,
      })

    } catch (e) {

      throw {err: {
          module: 'api/helpers/storage/client-create',
          message: sails.config.custom.CLIENTCREATE_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };
    }

  }


};

