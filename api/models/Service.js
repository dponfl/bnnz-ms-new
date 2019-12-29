"use strict";

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
    /**
     * Internal service name
     */
    name: {
      type: 'string',
    },
    /**
     * Public service name
     */
    title: {
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
    max_outgoing_posts_per_day: {
      type: 'number',
      columnType: 'integer',
      allowNull: true,
    },
    max_incoming_posts_per_day: {
      type: 'number',
      columnType: 'integer',
      allowNull: true,
    },
    make_likes: {
      type: 'number',
      columnType: 'integer',
      allowNull: true,
    },
    make_comments: {
      type: 'number',
      columnType: 'integer',
      allowNull: true,
    },
    deleted: {
      type: 'boolean',
    },
    account: {
      collection: 'account',
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

