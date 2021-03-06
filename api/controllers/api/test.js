"use strict";

module.exports = {


  friendlyName: 'Test different action',


  description: 'Test different action',


  inputs: {

    cid: {
      friendlyName: 'client guid',
      description: 'client guid',
      type: 'string',
      required: true,
    },
    action: {
      friendlyName: 'action to perform',
      description: 'action to perform',
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

    sails.log.warn('<<<<<<<<<<<<<<   test api   >>>>>>>>>>>>>');
    sails.log.warn('Params: ', inputs);

    let result = null;

    return exits.success(result);

    try {

      switch (inputs.action) {
        case 'add_room_to_client':
          let clientId = await Client.findOne({
            where: {guid: inputs.cid},
            select: ['id'],
          });
          sails.log.debug('clientId: ', clientId);
          // await Client.addToCollection(clientId, 'rooms', )
          break;
        default: sails.log.error('api/controllers/test error, wrong action, inputs: ', inputs);
      }

      return exits.success(result);

    } catch (e) {

      const errorLocation = 'api/controllers/test';
      const errorMsg = sails.config.custom.GENERAL_HELPER_ERROR;

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
