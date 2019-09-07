module.exports = {


  friendlyName: 'Update config',


  description: 'Update config',


  inputs: {

    key: {
      friendlyName: 'API key',
      description: 'API key',
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

    sails.log.warn('<<<<<<<<<<<<<<   config update api   >>>>>>>>>>>>>');
    sails.log.warn('Params: ', inputs);

    try {

      const checkApiKeyResult = await sails.helpers.general.checkApiKey.with({
        apiKey: inputs.key,
      });

      if (checkApiKeyResult.status !== 'ok') {

        return exits.success({
          status: 'nok',
          message: 'Config update error: Wrong API key',
        });

      }

      await sails.helpers.general.getConfig();

      return exits.success({
        status: 'ok',
        message: 'Config update success',
      });

    } catch (e) {

      const errorLocation = 'api/controllers/api/update';
      const errorMsg = sails.config.custom.UPDATE_CONTROLLER_ERROR;

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
