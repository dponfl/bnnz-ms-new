"use strict";

/**
 * TelegramMsgQueue.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'clientDb',
  tableName: 'msg-queue',
  migrate: 'safe',

  attributes: {

    guid: {
      type: 'string',
      unique: true,
    },

    clientGuid: {
      type: 'string',
      required: true,
    },

    accountGuid: {
      type: 'string',
      required: true,
    },

    channel: {
      type: 'string',
      required: true,
    },

    chatId: {
      type: 'string',
      required: true,
    },

    clientId: {
      type: 'number',
      required: true,
    },

    msgType: {
      type: 'string',
      required: true,
    },

    payload: {
      type: 'json',
      required: true,
    },

    done: {
      type: 'boolean',
    },

    deleted: {
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

