module.exports = {


  friendlyName: 'Distribute clients between two rooms',


  description: 'Distribute clients of oldRoom between oldRoom and newRoom',


  inputs: {
    oldRoom: {
      friendlyName: 'oldRoom number',
      description: 'oldRoom number',
      type: 'number',
      required: true,
    },
    newRoom: {
      friendlyName: 'newRoom number',
      description: 'newRoom number',
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

    const oldRoomWithClients = await Room.findOne({room: inputs.oldRoom})
      .populate('client');
    const newRoomWithClients = await Room.findOne({room: inputs.newRoom});

    // sails.log.warn('oldRoomWithClients: ', oldRoomWithClients);
    // sails.log.warn('newRoomWithClients: ', newRoomWithClients);

    try {

      _.forEach(oldRoomWithClients.client, async function (clientRec) {

        // sails.log.warn('clientRec: ', clientRec);

        if (
          !clientRec.deleted
          && !clientRec.banned
          && !clientRec.admin
          && clientRec.service_subscription_finalized
          && clientRec.subscription_active
        ) {

          if (_.random(0,1)) {

            // sails.log.info('Gonna re-allocate this client: ', clientRec);

            await Client.removeFromCollection(clientRec.id, 'room', oldRoomWithClients.id);
            await Client.addToCollection(clientRec.id, 'room', newRoomWithClients.id);
            await Room.updateOne({room: oldRoomWithClients.room})
              .set({clients_number: oldRoomWithClients.clients_number - 1});
            await Room.updateOne({room: newRoomWithClients.room})
              .set({clients_number: newRoomWithClients.clients_number + 1});
          }

        }

      });

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

