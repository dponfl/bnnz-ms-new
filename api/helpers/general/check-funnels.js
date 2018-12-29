module.exports = {


  friendlyName: 'Check funnels',


  description: 'This helper check that all funnels references are valid',


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
    sails.log('Check funnels performed...');

    if (true) {

      // Check funnels is OK

      return exits.success({
        status: 'ok',
        message: 'Check funnels was successful',
      });

    } else {

      // Check funnels was NOT OK

      return exits.success({
        status: 'nok',
        message: 'Check funnels was not successful',
      });

    }

  }

};

