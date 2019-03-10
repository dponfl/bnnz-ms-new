module.exports = {


  friendlyName: 'confirmPayment',


  description: 'confirmPayment',


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

  },


  fn: async function (inputs, exits) {
    sails.log('Check funnels performed...');

    let checkError = [];

    // todo: Need to check:
    // 1. actionType is correct
    // 2. all specified helpers exist
    // Check helper can be performed by the helper call
    // with first parameter (which to be checkStatus = true)
    // As the result helpers should return status = ok
    // If the result is not ok we need to push to checkError a string
    // with wrong helper name, like 'wrongHelper"

    if (true) {

      // Check funnels is OK

      return exits.success({
        status: 'ok',
        message: sails.config.custom.CHECKFUNNELS_SUCCESS,
        payload: {}
      });

    } else {

      // Check funnels was NOT OK

      // return exits.success({
      //   status: 'nok',
      //   message: 'Check funnels was not successful',
      //   payload: {checkError: checkError}
      // });

      throw {err: {
          module: 'api/helpers/general/check-funnels',
          message: sails.config.custom.CHECKFUNNELS_GENERAL_ERROR,
          payload: {checkError: checkError}
        }
      };

    }

  }

};

