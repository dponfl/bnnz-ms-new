"use strict";

const _ = require('lodash');

const moduleName = 'Helper storage:get-clients-by-rooms';

module.exports = {


  friendlyName: 'Get clients list by rooms list',


  description: 'Returns the array of clients records by rooms list',


  inputs: {
    rooms: {
      friendlyName: 'rooms',
      description: 'Array of rooms',
      type: 'ref',
      required: true,
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log(moduleName + ', inputs: ', inputs);

    let clientsList = {};

    try {

      for (const room of inputs.rooms) {
        const accountsListByRoom = await Account.find()
          .populate('room', {
            where: {
              id: room,
            }
          });

        for (const acc of accountsListByRoom) {
          const clientRecord = await Client.findOne({
            id: acc.client,
          });

          // sails.log.warn('clientRecord: ', clientRecord);

          if (clientRecord) {

            /**
             * Record for the client was found
             */

            clientsList[clientRecord.id] = _.pick(clientRecord, [
              'id',
              'guid',
              'first_name',
              'last_name',
              'chat_id',
              'username',
              'messenger',
              'deleted',
              'banned',
              'admin',
              'lang',
              'account_use',
            ]);

            // sails.log.warn('clientsList: ', clientsList);
          }
        }
      }

      // sails.log.info('clientsList: ', clientsList);

      return exits.success({
        status: 'ok',
        message: 'List of clients',
        payload: clientsList,
      })

    } catch (e) {

      throw {err: {
          module: 'api/helpers/storage/get-clients-by-rooms',
          message: sails.config.custom.GENERAL_HELPER_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

  }


};


