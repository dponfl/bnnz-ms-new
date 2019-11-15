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
    key: {
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
    ref_key: {
      type: 'string',
    },
    is_ref: {
      type: 'boolean',
    },
    tos_accepted: {
      type: 'boolean',
    },
    messenger: {
      type: 'string',
    },
    password: {
      type: 'string',
    },
    deleted: {
      type: 'boolean',
    },
    banned: {
      type: 'boolean',
    },
    admin: {
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

