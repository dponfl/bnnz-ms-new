const _ = require('lodash');

module.exports = {


  friendlyName: 'Find or create a new room',


  description: 'Find or create a new room',


  inputs: {
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log.debug('general:getRoom helper...');
    // sails.log.debug('input params: ', inputs);

    let resultRoomNumber = null;
    let resultRoomId = null;
    let totalRooms = 0;

    try {

      totalRooms = await Room.count({active: true});

      if (!totalRooms) {

        /**
         * There are no rooms in Room table yet and we need create it
         */

        await Room.create({
          room: 1,
          clients_number: 0,
          active: true,
        });

        totalRooms = 1;

      }

      const roomNumber = _.random(1, totalRooms);

      /**
       * Get room record for the specified roomNumber
       */

      const roomRec = await Room.findOne({room: roomNumber});

      if (!roomRec) {
        throw new Error('No room found for the specified room number, room: ' + roomNumber);
      }

      /**
       * Check if the selected room have vacant space
       */

      if (roomRec.clients_number >= sails.config.custom.config.rooms.clients_per_room) {

        /**
         * We need to create a new room and distribute the existing clients of roomRec
         * between these two rooms
         */

        const newRoom = await Room.create({
          room: totalRooms + 1,
          clients_number: 0,
          active: true,
        });

        await sails.helpers.general.distributeClients.with({
          oldRoom: roomRec.room,
          newRoom: totalRooms + 1
        });

        resultRoomNumber = totalRooms + 1;
        resultRoomId = newRoom.id;

      } else {

        resultRoomNumber = roomRec.room;
        resultRoomId = roomRec.id;

      }

      return exits.success({
        status: 'ok',
        message: 'Room found',
        payload: {
          room_id: resultRoomId,
          room: resultRoomNumber,
        }
      });


    } catch (e) {
      sails.log.error('api/helpers/general/get-room, error: ', e);
      throw {err: {
          module: 'api/helpers/general/get-room',
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

