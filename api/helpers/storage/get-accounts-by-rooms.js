"use strict";

const _ = require('lodash');

const moduleName = 'storage:get-accounts-by-rooms';

module.exports = {


  friendlyName: 'Get accounts list by rooms list',


  description: 'Returns the array of accounts records by rooms list',


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

    let accountsList = {};

    try {

      for (const room of inputs.rooms) {
        const accountsListByRoom = await Account.find({
          where: {
            subscription_active: true,
            deleted: false,
            banned: false,
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

            const criteria = {
              id: acc.client,
            };

            const clientRaw = await sails.helpers.storage.clientGetByCriteriaJoi({
              criteria,
            });

            if (clientRaw.status !== 'ok') {
              throw new Error(`${moduleName}, error: wrong clientGetByCriteriaJoi reply:
              criteria: ${JSON.stringify(criteria, null, 3)}
              clientRaw: ${JSON.stringify(clientRaw, null, 3)}`);
            }

            if (clientRaw.payload.length !== 1) {
              throw new Error(`${moduleName}, error: several or none clients found:
              criteria: ${JSON.stringify(criteria, null, 3)}
              clientRaw.payload: ${JSON.stringify(clientRaw.payload, null, 3)}`);
            }

            acc.client = clientRaw.payload[0];

            accountsList.push(_.pick(acc, [
              'id',
              'guid',
              'client',
              'inst_profile',
              'posts_received_day',
              'posts_received_total',
            ]));

          }
        }
      }

      return exits.success({
        status: 'ok',
        message: 'List of clients',
        payload: accountsList,
      })

    } catch (e) {

      sails.log.error(`${moduleName}, error: ${e}`);

      throw {err: {
          module: `${moduleName}`,
          message: sails.config.custom.GENERAL_HELPER_ERROR,
          payload: {},
        }
      };

    }

  }


};


