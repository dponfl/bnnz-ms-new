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
    keyboard_name: {
      type: 'string',
      allowNull: true,
    },
    push_message_name: {
      type: 'string',
      allowNull: true,
    },
    rooms: {
      type: 'number',
      columnType: 'integer',
      allowNull: true,
    },
    max_outgoing_posts_day: {
      type: 'number',
      columnType: 'integer',
      allowNull: true,
    },
    max_incoming_posts_day: {
      type: 'number',
      columnType: 'integer',
      allowNull: true,
    },
    make_likes_min_day: {
      type: 'number',
      columnType: 'integer',
      allowNull: true,
    },
    make_comments_min_day: {
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

