module.exports = {


  friendlyName: 'Profiles subscription confirmation',


  description: 'Profiles subscription confirmation',


  inputs: {

    cid: {
      friendlyName: 'client guid',
      description: 'client guid',
      type: 'string',
      required: true,
    },

  },


  exits: {
    success: {
      description: 'All done.',
    },
  },


  fn: async function (inputs, exits) {

    sails.log.warn('<<<<<<<<<<<<<<   subscription api   >>>>>>>>>>>>>');
    sails.log.warn('Params: ', inputs);

    try {

      let result = await sails.helpers.general.confirmSubscription.with({
        cid: inputs.cid,
      });

      return exits.success(result);

    } catch (e) {

      sails.log.error('api/controllers/subscription error, input: ', inputs);
      sails.log.error('api/controllers/subscription error, error: ', e);

      throw {err: {
          module: 'api/controllers/subscription',
          message: sails.config.custom.SUBSCRIPTION_CONTROLLER_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          },
        }
      };

    }

  }


};
