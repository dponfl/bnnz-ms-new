"use strict";

/**
 * Client.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'client',
  migrate: 'safe',
  attributes: {

    guid: {
      type: 'string',
      unique: true,
    },
    first_name: {
      type: 'string',
    },
    last_name: {
      type: 'string',
    },
    chat_id: {
      type: 'string',
      unique: true,
    },
    username: {
      type: 'string',
    },
    category: {
      type: 'string',
    },
    tos_accepted: {
      type: 'boolean',
    },
    messenger: {
      type: 'string',
    },
    login: {
      type: 'string',
    },
    password_hash: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
    banned: {
      type: 'boolean',
    },
    messages: {
      collection: 'messages',
      via: 'client_id',
    },
    lang: {
      type: 'string',
    },
    funnel_name: {
      type: 'string',
    },
    current_funnel: {
      type: 'string',
    },
    funnels: {
      type: 'json',
    },
    account_use: {
      type: 'string',
    },
    account_tmp: {
      type: 'string',
      allowNull: true,
    },
    inst_profile_tmp: {
      type: 'string',
      allowNull: true,
    },


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

