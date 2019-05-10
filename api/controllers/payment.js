module.exports = {


  friendlyName: 'Payment',


  description: 'Payment something.',


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
    sl: {
      friendlyName: 'service level',
      description: 'service level',
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

    sails.log.warn('<<<<<<<<<<<<<<   payment api   >>>>>>>>>>>>>');
    sails.log.warn('Params: ', inputs);

    try {

      let result = await sails.helpers.general.confirmPayment.with({
        cid: inputs.cid,
        aid: inputs.aid,
        sl: inputs.sl,
      });

      return exits.success(result);

    } catch (e) {

      sails.log.error('api/controllers/payment error, input: ', inputs);
      sails.log.error('api/controllers/payment error, error: ', e);

      throw {err: {
          module: 'api/controllers/payment',
          message: sails.config.custom.PAYMENT_CONTROLLER_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          },
        }
      };

    }

  }


};
