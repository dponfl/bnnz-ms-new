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
      allowNull: true,
    },
    posts_per_day: {
      type: 'number',
      columnType: 'integer',
      allowNull: true,
    },
    incoming_posts_per_day: {
      type: 'number',
      columnType: 'integer',
      allowNull: true,
    },
    deleted: {
      type: 'boolean',
    },
    client: {
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

