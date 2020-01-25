"use strict";

const _ = require('lodash');

const moduleName = 'general:allocateRooms';

module.exports = {


  friendlyName: 'Find or create a new rooms and allocates them to the account',


  description: 'Find or create a new rooms and allocates them to the account',


  inputs: {
    accountGuid: {
      friendlyName: 'account guid',
      description: 'account guid',
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
     * Находит/создаёт количество комнат в соответствии с уровнем сервиса аккаунта
     * (соответственно увеличивая счётчики аккаунтов в них) и связывает их с аккаунтом
     * Возвращает:
     *  - массив объектов комнат
     *  - массив ID этих комнат
     */

    sails.log.info(`*** ${moduleName} ***`);

    // sails.log.debug('input params: ', inputs);

    let roomRecordWeGet;
    let roomResultArray = [];
    let roomResultIDsArray = [];
    let usedRooms = [];

    try {

      const accountRaw = await sails.helpers.storage.accountGet.with({
        accountGuids: [inputs.accountGuid],
      });

      if (accountRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: Unknown accountGuid="${inputs.accountGuid}"`);
      }

      const account = accountRaw.payload;

      const roomsNum = account.service.rooms;

      for (let i=0; i < roomsNum; i++) {
        roomRecordWeGet = await allocateOneRoom(usedRooms, account);
        usedRooms.push(roomRecordWeGet);
        roomResultArray.push(roomRecordWeGet);
        roomResultIDsArray.push(roomRecordWeGet.id);
      }

      return exits.success({
        status: 'ok',
        message: 'Rooms allocated',
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

async function allocateOneRoom(doNotUseRooms, accountRec) {

  /**
   * Возвращает елемент таблицы Room в который может размещаться клиент
   * (счётчик клиентов соответственно увеличивается)
   */

  // sails.log.warn('<<<<<<< !!!!!! >>>>>>> allocateOneRoom, doNotUseRooms: ', doNotUseRooms);

  let totalRooms = 0; // counter of how many rooms exists before new allocation
  let checkedRooms = []; // we mark room by used=true if this room was
  // already allocated for this client (e.g. the room is in "doNotUseRooms" array)
  let filteredRooms = []; // keep list of rooms not allocated to the client yet
  let roomRec;
  let rooms;

  try {

    totalRooms = await Room.count();

    const accountCategory = sails.config.custom.config.rooms.category_by_service[accountRec.service.name];

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

      await Account.addToCollection(accountRec.id, 'room', newRoom.id);

      await sails.helpers.general.mixAccountsInRooms.with({
        accountRec: accountRec,
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

    const errorLocation = 'api/helpers/general/allocate-rooms=>allocateOneRoom';
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

