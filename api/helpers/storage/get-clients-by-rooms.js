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

    sails.log.info(moduleName + ', inputs: ', inputs);

    let clientsList = {};

    try {

      for (const room of inputs.rooms) {
        const accountsListByRoom = await Account.find({
          where: {
            subscription_active: true,
            deleted: false,
          }
        })
          .populate('service')
          .populate('room', {
            where: {
              id: room,
            }
          });

        for (const acc of accountsListByRoom) {

          if (acc.posts_received_day < acc.service.max_incoming_posts_per_day) {

            const clientRecord = await Client.findOne({
              where: {
                id: acc.client,
                deleted: false,
                banned: false,
              }
            });

            // sails.log.warn('clientRecord: ', clientRecord);

            if (clientRecord) {

              /**
               * Record for the client was found
               */

              clientsList[clientRecord.id] = {
                client: _.pick(clientRecord, [
                  'id',
                  'guid',
                  'first_name',
                  'last_name',
                  'chat_id',
                  'username',
                  'messenger',
                  'deleted',
                  'banned',
                  'role',
                  'lang',
                  'account_use',
                ]),
                account: _.pick(acc, [
                  'id',
                  'guid',
                  'inst_profile',
                  'posts_received_day',
                  'posts_received_total',
            ]),
              } ;

              // sails.log.warn('clientsList: ', clientsList);
            }
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

      sails.log.error('api/helpers/storage/get-clients-by-rooms, error: ', e);

      throw {err: {
          module: 'api/helpers/storage/get-clients-by-rooms',
          message: sails.config.custom.GENERAL_HELPER_ERROR,
          payload: {},
        }
      };

    }

  }


};


