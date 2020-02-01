"use strict";

const _ = require('lodash');

const moduleName = 'general:reallocateRoomsToAccount';

module.exports = {


  friendlyName: 'Re-allocate rooms to the specific account',


  description: 'Re-allocate rooms to the specific account',


  inputs: {
    account: {
      friendlyName: 'account record',
      description: 'account record',
      type: 'ref',
      required: true,
    },

  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    /**
     * Для указанного аккаунта:
     *    - удаляет связь аккаунта с комнатами
     *    - освобождает комнату от этого аккаунта
     *    - получает новые комнаты для размещения аккаунта
     *    - устанавливает новые связи аккаунта с новыми комнатами
     */

    try {

      sails.log.info(`*** ${moduleName} ***`);

      // sails.log.debug('input params: ', inputs);

      const accountCategory = sails.config.custom.config.rooms.category_by_service[inputs.account.service.name];

      if (accountCategory == null) {
        throw new Error(`${moduleName}, error: Unknown account category for the following inputs.account.service.name="${inputs.account.service.name}"`);
      }

      _.forEach(inputs.account.room, async function (elem) {
        let room = await Room.findOne({id: elem.id});

        if (room) {
          await Account.removeFromCollection(inputs.account.id, 'room', room.id);

          switch (accountCategory) {
            case 'bronze':
              await Room.updateOne({id: room.id})
                .set({
                  bronze: room.bronze - 1,
                  accounts_number: room.accounts_number - 1
                });
              break;

            case 'gold':
              await Room.updateOne({id: room.id})
                .set({
                  gold: room.gold - 1,
                  accounts_number: room.accounts_number - 1
                });
              break;

            case 'platinum':
              await Room.updateOne({id: room.id})
                .set({
                  platinum: room.platinum - 1,
                  accounts_number: room.accounts_number - 1
                });
              break;

            case 'star':
              await Room.updateOne({id: room.id})
                .set({
                  star: room.star - 1,
                  accounts_number: room.accounts_number - 1
                });
              break;

            default: throw new Error(`${moduleName}, error: Unknown client category="${accountCategory}"`);
          }

        }
      });

      const rooms = await sails.helpers.general.allocateRooms.with({
        accountGuid: inputs.account.guid,
      });

      // sails.log.debug('linkRoomsToClient, rooms:', rooms);

      return exits.success({
        status: 'ok',
        message: 'Rooms re-allocated to the account',
        payload: {rooms: rooms}
      });

    } catch (e) {

      const errorLocation = 'api/helpers/general/reallocate-rooms-to-account';
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

