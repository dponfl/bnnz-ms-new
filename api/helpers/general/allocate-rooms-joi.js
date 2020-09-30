"use strict";

const _ = require('lodash');

const Joi = require('@hapi/joi');

const moduleName = 'general:allocate-rooms-joi';

module.exports = {


  friendlyName: 'Find or create a new rooms and allocates them to the account',


  description: 'Find or create a new rooms and allocates them to the account',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
      type: 'ref',
      required: true,
    },

  },


  exits: {
    success: {
      description: 'All done.',
    },
    err: {
      description: 'Error',
    }
  },


  fn: async function (inputs, exits) {

    /**
     * Находит/создаёт количество комнат в соответствии с уровнем сервиса аккаунта
     * (соответственно увеличивая счётчики аккаунтов в них) и связывает их с аккаунтом
     * Возвращает:
     *  - массив объектов комнат
     *  - массив ID этих комнат
     */

    const schema = Joi.object({
      accountGuid: Joi
        .string()
        .description('account guid')
        .guid()
        .required(),
    });

    let input;

    let roomRecordWeGet;
    let roomResultArray = [];
    let roomResultIDsArray = [];
    let usedRooms = [];

    try {

      input = await schema.validateAsync(inputs.params);

      const accountRaw = await sails.helpers.storage.accountGetJoi({
        accountGuids: [input.accountGuid],
      });

      if (accountRaw.status !== 'ok') {
        // throw new Error(`${moduleName}, error: Unknown accountGuid="${input.accountGuid}"`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Unknown accountGuid',
          accountGuid: input.accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            accountGuid: input.accountGuid,
          },
          createDbRecord: false,
        });

      }

      const account = accountRaw.payload[0] || null;

      if (account == null) {
        // throw new Error(`${moduleName}, error: Unexpected result:
        // accountRaw.payload: ${JSON.stringify(accountRaw.payload, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No accounts found',
          accountGuid: input.accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            accountRaw,
          },
          createDbRecord: false,
        });

      }

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

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          createDbRecord: false,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          createDbRecord: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }
  }
};

async function allocateOneRoom(doNotUseRooms, accountRec) {

  const methodName = 'allocateOneRoom';

  /**
   * Возвращает елемент таблицы Room в который может размещаться клиент
   * (счётчик клиентов соответственно увеличивается)
   */

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
            gold: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.gold}
          },
        });
        break;

      case 'platinum':

        rooms = await Room.find({
          where: {
            active: true,
            platinum: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.platinum}
          },
        });
        break;

      case 'star':

        rooms = await Room.find({
          where: {
            active: true,
            star: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.star}
          },
        });
        break;

      default:
        // throw new Error(`${moduleName}, error: Unknown account category="${accountCategory}"`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Unknown account category',
          accountGuid: accountRec.guid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            accountCategory,
          },
          createDbRecord: false,
        });

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
        accounts_number: 0,
        active: true,
      }).fetch();

      totalRooms = 1;

    } else {

      filteredRooms = _.filter(checkedRooms, function (val) {
        return !val.used;
      });

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
          accounts_number: 0,
          active: true,
        }).fetch();

      }

    }

    /**
     * Check if the selected room have vacant space
     */

    if (roomRec.accounts_number >= sails.config.custom.config.rooms.accounts_per_room
      || (accountCategory === 'bronze'
        && roomRec.bronze >= sails.config.custom.config.rooms.accounts_distribution_by_category.bronze)
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
        accounts_number: 1,
        active: true,
      }).fetch();

      await Account.addToCollection(accountRec.id, 'room', newRoom.id);

      await sails.helpers.general.mixAccountsInRooms.with({
        accountRec: accountRec,
        oldRoom: roomRec.room,
        newRoom: newRoom.room
      });

      roomRec = newRoom;

    } else {

      roomRec = await Room.updateOne({room: roomRec.room})
        .set({
          bronze: accountCategory === 'bronze' ? roomRec.bronze + 1 : roomRec.bronze,
          gold: accountCategory === 'gold' ? roomRec.gold + 1 : roomRec.gold,
          platinum: accountCategory === 'platinum' ? roomRec.platinum + 1 : roomRec.platinum,
          star: accountCategory === 'star' ? roomRec.star + 1 : roomRec.star,
          accounts_number: roomRec.accounts_number + 1
        });

      await Account.addToCollection(accountRec.id, 'room', roomRec.id);

    }

    return roomRec;

  } catch (e) {

    // const errorLocation = moduleName + ':' + methodName;
    // const errorMsg = `${moduleName}:${methodName}: General error`;
    //
    // sails.log.error(errorLocation + ', error: ' + errorMsg);
    // sails.log.error(errorLocation + ', error details: ', e);
    //
    // throw {err: {
    //     module: errorLocation,
    //     message: errorMsg,
    //     payload: {
    //       error: e,
    //     },
    //   }
    // };

    const throwError = true;
    if (throwError) {
      return await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
        throwError: true,
        createDbRecord: false,
      });
    } else {
      await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
        throwError: false,
        createDbRecord: false,
      });
      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      });
    }

  }
}

