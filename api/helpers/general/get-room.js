const _ = require('lodash');

module.exports = {


  friendlyName: 'Find or create a new room',


  description: 'Find or create a new room',


  inputs: {
    roomsNum: {
      friendlyName: 'number of rooms to be found/created',
      description: 'number of rooms to be found/created',
      type: 'number',
      required: true,
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log.info('general:getRoom helper...');
    // sails.log.debug('input params: ', inputs);

    let roomRecordWeGet;
    let roomResultArray = [];
    let roomResultIDsArray = [];
    let usedRooms = [];

    try {

      for (let i=0; i < inputs.roomsNum; i++) {
        roomRecordWeGet = await getOneRoom(usedRooms);
        usedRooms.push(roomRecordWeGet);
        roomResultArray.push(roomRecordWeGet);
        roomResultIDsArray.push(roomRecordWeGet.id);
      }

      return exits.success({
        status: 'ok',
        message: 'Room found',
        payload: {
          roomRes: roomResultArray,
          roomIDsRes: roomResultIDsArray,
        }
      });

    } catch (e) {

      sails.log.error('api/helpers/general/get-room, error: ', e);

      throw {err: {
          module: 'api/helpers/general/get-room',
          message: sails.config.custom.GENERAL_HELPER_ERROR,
          payload: {},
        }
      }
    }
  }
};

async function getOneRoom(doNotUseRooms) {

  // sails.log.warn('<<<<<<< !!!!!! >>>>>>> getOneRoom, doNotUseRooms: ', doNotUseRooms);

  let totalRooms = 0; // counter of how many rooms exists before new allocation
  let checkedRooms = []; // we mark room by used=true if this room was already allocated for this client
  let filteredRooms = []; // keep list of rooms not allocated to the client yet
  let roomRec;

  try {

    totalRooms = await Room.count({active: true});
    let rooms = await Room.find({active: true});

    _.forEach(rooms, function (val) {
      if (!_.find(doNotUseRooms, function (el) {
        return (val.room === el.room);
      })) {
        checkedRooms.push({room: val, used: false});
      } else {
        checkedRooms.push({room: val, used: true});
      }
    });

    // sails.log.warn('checkedRooms: ', checkedRooms);

    if (!totalRooms) {

      /**
       * There are no rooms in Room table yet and we need create it
       */

      roomRec = await Room.create({
        room: 1,
        clients_number: 0,
        active: true,
      }).fetch();

      totalRooms = 1;

    } else {

      filteredRooms = _.filter(checkedRooms, function (val) {
        return !val.used;
      });

      // sails.log.warn('filteredRooms: ', filteredRooms);

      if (filteredRooms.length > 0) {

        let elemNumber = _.random(0, filteredRooms.length - 1);

        /**
         * Get room record for the specified roomNumber
         */

        roomRec = filteredRooms[elemNumber].room;

      } else {

        roomRec = await Room.create({
          room: totalRooms + 1,
          clients_number: 0,
          active: true,
        }).fetch();

      }

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
        clients_number: 1,
        active: true,
      }).fetch();

      await sails.helpers.general.distributeClients.with({
        oldRoom: roomRec.room,
        newRoom: totalRooms + 1
      });

      roomRec = newRoom;

    } else {

      await Room.updateOne({room: roomRec.room})
        .set({clients_number: roomRec.clients_number + 1});

    }

    return roomRec;

  } catch (e) {

    sails.log.error('api/helpers/general/get-room=>getOneRoom, error: ', e);

    throw {err: {
        module: 'api/helpers/general/get-room=>getOneRoom',
        message: sails.config.custom.GENERAL_HELPER_ERROR,
        payload: {},
      }
    }
  }
}

