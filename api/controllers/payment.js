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
    sl: {
      friendlyName: 'service level',
      description: 'service level',
      type: 'string',
      required: true,
    },

  },


  exits: {

  },


  fn: async function (inputs, exits) {

    sails.log.warn('<<<<<<<<<<<<<<   payment api   >>>>>>>>>>>>>');
    sails.log.warn('Params: ', inputs);

    try {

      await sails.helpers.general.confirmPayment.with({
        clientId: inputs.cid,
        sl: inputs.sl,
      });

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
