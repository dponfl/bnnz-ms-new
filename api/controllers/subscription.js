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
    aid: {
      friendlyName: 'account guid',
      description: 'account guid',
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
        aid: inputs.aid,
      });

      return exits.success(result);

    } catch (e) {

      const errorLocation = 'api/controllers/subscription';
      const errorMsg = sails.config.custom.SUBSCRIPTION_CONTROLLER_ERROR;

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
