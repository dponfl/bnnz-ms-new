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

      let client = await Client.create(inputs.client).fetch();

      /**
       * At client create we place the client at room #0
       * and then reallocate it to the different rooms according to the client's service level
       */

      client = await Client.findOne({guid: client.guid})
        .populate('room')
        .populate('service');

      sails.log.warn('<<<<<<< !!!!!!!!!!!! >>>>>>> client data object: ', client);

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

