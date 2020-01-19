"use strict";

const _ = require('lodash');

const moduleName = 'general:getRoom';

module.exports = {


  friendlyName: 'Find or create a new room',


  description: 'Find or create a new room',


  inputs: {
    roomsNum: {
      friendlyName: 'number of rooms to be found/created',
      description: 'number of rooms to be found/created',
      type: 'number',
      required: true,
    },

    accountCategory: {
      friendlyName: 'account category',
      description: 'account category',
      type: 'string',
      required: true,
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    /**
     * Находит/создаёт inputs.roomsNum комнат для размещения клиента
     * (соответственно увеличивая счётчики клиентов в них)
     * Возвращает:
     *  - массив объектов комнат
     *  - массив ID этих комнат
     */

    sails.log.info('general:getRoom helper...');

    // sails.log.debug('input params: ', inputs);

    let roomRecordWeGet;
    let roomResultArray = [];
    let roomResultIDsArray = [];
    let usedRooms = [];

    try {

      for (let i=0; i < inputs.roomsNum; i++) {
        roomRecordWeGet = await getOneRoom(usedRooms, inputs.accountCategory);
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

      const errorLocation = 'api/helpers/general/get-room';
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

async function getOneRoom(doNotUseRooms, accountCategory) {

  /**
   * Возвращает елемент таблицы Room в который может размещаться клиент
   * (счётчик клиентов соответственно увеличивается)
   */

  // sails.log.warn('<<<<<<< !!!!!! >>>>>>> getOneRoom, doNotUseRooms: ', doNotUseRooms);

  let totalRooms = 0; // counter of how many rooms exists before new allocation
  let checkedRooms = []; // we mark room by used=true if this room was
  // already allocated for this client (e.g. the room is in "doNotUseRooms" array)
  let filteredRooms = []; // keep list of rooms not allocated to the client yet
  let roomRec;
  let rooms;

  try {

    totalRooms = await Room.count();

    switch (accountCategory) {
      case 'bronze':

        rooms = await Room.find({
          where: {
            active: true
          },
        });
        break;

      case 'gold':

        rooms = await Room.find({
          where: {
            active: true,
            gold: {'<': sails.config.custom.config.rooms.clients_distribution_by_category.gold}
          },
        });
        break;

      case 'platinum':

        rooms = await Room.find({
          where: {
            active: true,
            platinum: {'<': sails.config.custom.config.rooms.clients_distribution_by_category.platinum}
          },
        });
        break;

      case 'star':

        rooms = await Room.find({
          where: {
            active: true,
            star: {'<': sails.config.custom.config.rooms.clients_distribution_by_category.star}
          },
        });
        break;

      default: throw new Error(`${moduleName}, error: Unknown account category="${accountCategory}"`);
    }


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
        bronze: 0,
        gold: 0,
        platinum: 0,
        star: 0,
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
          bronze: 0,
          gold: 0,
          platinum: 0,
          star: 0,
          clients_number: 0,
          active: true,
        }).fetch();

      }

    }

    /**
     * Check if the selected room have vacant space
     */

    if (roomRec.clients_number >= sails.config.custom.config.rooms.clients_per_room
      || (accountCategory === 'bronze'
        && roomRec.bronze >= sails.config.custom.config.rooms.clients_distribution_by_category.bronze)
    ) {

      /**
       * We need to create a new room and distribute the existing clients of roomRec
       * between these two rooms
       */

      const newRoom = await Room.create({
        room: totalRooms + 1,
        bronze: accountCategory === 'bronze' ? 1 : 0,
        gold: accountCategory === 'gold' ? 1 : 0,
        platinum: accountCategory === 'platinum' ? 1 : 0,
        star: accountCategory === 'star' ? 1 : 0,
        clients_number: 1,
        active: true,
      }).fetch();

      await sails.helpers.general.distributeClients.with({
        accountCategory: accountCategory,
        oldRoom: roomRec.room,
        newRoom: totalRooms + 1
      });

      roomRec = newRoom;

    } else {

      roomRec = await Room.updateOne({room: roomRec.room})
        .set({
          bronze: accountCategory === 'bronze' ? roomRec.bronze + 1 : roomRec.bronze,
          gold: accountCategory === 'gold' ? roomRec.gold + 1 : roomRec.gold,
          platinum: accountCategory === 'platinum' ? roomRec.platinum + 1 : roomRec.platinum,
          star: accountCategory === 'star' ? roomRec.star + 1 : roomRec.star,
          clients_number: roomRec.clients_number + 1
        });

    }

    return roomRec;

  } catch (e) {

    const errorLocation = 'api/helpers/general/get-room=>getOneRoom';
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

