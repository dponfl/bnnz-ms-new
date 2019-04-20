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

    const oldRoomWithAccounts = await Room.findOne({room: inputs.oldRoom})
      .populate('account');
    const newRoomWithAccounts = await Room.findOne({room: inputs.newRoom});
    const client = Client.findOne({id: oldRoomWithAccounts.account[0].client});

    // sails.log.warn('oldRoomWithAccounts: ', oldRoomWithAccounts);
    // sails.log.warn('newRoomWithAccounts: ', newRoomWithAccounts);

    try {

      _.forEach(oldRoomWithAccounts.account, async function (accountRec) {

        // sails.log.warn('accountRec: ', accountRec);

        if (
          !client.deleted
          && !client.banned
          && !accountRec.deleted
          && accountRec.service_subscription_finalized
          && accountRec.subscription_active
        ) {

          if (_.random(0,1)) {

            // sails.log.info('Gonna re-allocate this account: ', accountRec);

            await Account.removeFromCollection(accountRec.id, 'room', oldRoomWithAccounts.id);
            await Account.addToCollection(accountRec.id, 'room', newRoomWithAccounts.id);
            await Room.updateOne({room: oldRoomWithAccounts.room})
              .set({clients_number: oldRoomWithAccounts.clients_number - 1});
            await Room.updateOne({room: newRoomWithAccounts.room})
              .set({clients_number: newRoomWithAccounts.clients_number + 1});
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

