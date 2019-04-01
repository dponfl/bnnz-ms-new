module.exports = {


  friendlyName: 'Distribute clients between two rooms',


  description: 'Distribute clients of oldRoom between oldRoom and newRoom',


  inputs: {
    oldRoom: {
      friendlyName: 'oldRoom',
      description: 'oldRoom',
      type: 'number',
      required: true,
    },
    newRoom: {
      friendlyName: 'newRoom',
      description: 'newRoom',
      type: 'number',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log.debug('general:distributeClients helper...');
    sails.log.debug('input params: ', inputs);


    try {

      // const oldRoomId = await Room.findOne({room: inputs.oldRoom}).id;
      // const newRoomId = await Room.findOne({room: inputs.newRoom}).id;
      //
      // const oldRoomClients = await Client.find({
      //   where: {
      //     deleted: false,
      //     banned: false,
      //     service_subscription_finalized: true,
      //     subscription_active: true,
      //     rooms: inputs.oldRoom
      //   },
      //   select: ['id', 'guid', 'rooms'],
      // });


      return exits.success({
        status: 'ok',
        message: 'Distribute clients success',
        payload: {
        }
      });

    } catch (e) {

      sails.log.error('api/helpers/general/distribute-clients, error: ', e);

      throw {err: {
          module: 'api/helpers/general/distribute-clients',
          message: sails.config.custom.GENERAL_HELPER_ERROR,
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

