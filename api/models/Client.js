"use strict";

/**
 * Client.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'clientDb',
  tableName: 'client',
  migrate: 'safe',
  attributes: {

    guid: {
      type: 'string',
      unique: true,
    },
    first_name: {
      type: 'ref',
      columnType: 'text CHARACTER SET utf8mb4',
    },
    first_name_c: {
      type: 'string',
    },
    last_name: {
      type: 'ref',
      columnType: 'text CHARACTER SET utf8mb4',
    },
    last_name_c: {
      type: 'string',
    },
    chat_id: {
      type: 'string',
      unique: true,
    },

    /**
     * Флаг, что клиенту в данный момент нельзя отправлять сообщения
     * (aka "Do Not Disturb")
     */
    dnd: {
      type: 'boolean',
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
    ref_key: {
      type: 'string',
      allowNull: true,
    },
    messenger: {
      type: 'string',
    },
    login: {
      type: 'string',
      allowNull: true,
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
    forced_reply_expected: {
      type: 'boolean',
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

