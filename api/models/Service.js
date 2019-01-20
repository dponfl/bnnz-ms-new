/**
 * Service.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'service',
  migrate: 'safe',
  attributes: {

    guid: {
      type: 'string',
      unique: true,
    },
    name: {
      type: 'string',
    },
    funnel_name: {
      description: 'Field "name" of Funnels table',
      type: 'string',
    },
    funnel_start: {
      description: 'Funnel name to use',
      type: 'string',
    },
    rooms: {
      type: 'number',
      columnType: 'integer',
    },
    messages: {
      type: 'number',
      columnType: 'integer',
    },
    messages_to_stars: {
      type: 'number',
      columnType: 'integer',
    },
    check_profile: {
      type: 'boolean',
    },
    check_payment: {
      type: 'boolean',
    },
    check_subscription: {
      type: 'boolean',
    },
    deleted: {
      type: 'boolean',
    },
    user: {
      collection: 'client',
      via: 'service',
    }

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝


    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

  },

};

