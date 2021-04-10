"use strict";

/**
 * Messages.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'clientDb',
  tableName: 'messages',
  migrate: 'safe',
  attributes: {

    messageGuid: {
      type: 'string',
      unique: true,
    },

    /**
     * message_id - уникальный идентификатор сообщения внутри мессенджера
     */
    messageId: {
      type: 'string',
      allowNull: true,
    },

    callbackQueryId: {
      type: 'string',
      allowNull: true,
    },

    // message: {
    //   type: 'ref',
    //   columnType: 'text CHARACTER SET utf8mb4',
    // },

    message: {
      type: 'json',
    },

    messageFormat: {
      type: 'string',
      allowNull: true,
    },

    channel: {
      type: 'string',
      allowNull: true,
    },

    messageOriginator: {
      type: 'string',
      allowNull: true,
    },

    clientId: {
      model: 'client',
    },

    clientGuid: {
      type: 'string',
    },

    accountGuid: {
      type: 'string',
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

