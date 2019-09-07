module.exports = {


  friendlyName: 'Test',


  description: 'Test',


  inputs: {

    test: {
      friendlyName: 'test',
      description: 'test',
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

    sails.log.info('Test: ', inputs);

    try {


      return exits.success({
        status: 'ok',
        message: 'Test success',
        payload: {},
      })

    } catch (e) {

      const errorLocation = 'api/helpers/pgw/yandex/test';
      const errorMsg = "Some error";

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

