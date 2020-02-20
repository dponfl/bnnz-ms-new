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

    sails.log.info(`*************** ${moduleName} ***************`);

    let accountsList = {};

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

            accountsList.push(_.pick(acc, [
              'id',
              'guid',
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


