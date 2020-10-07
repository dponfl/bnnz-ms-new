"use strict";

/**
 * Room.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'clientDb',
  tableName: 'room',
  migrate: 'safe',
  attributes: {

    active: {
      type: 'boolean',
      required: true,
    },

    /**
     * Флаг, что запись находится в обработке и её нельзя использовать/изменять и т.п.
     */
    locked: {
      type: 'boolean',
    },
    bronze: {
      type: 'number',
      columnType: 'integer',
    },
    gold: {
      type: 'number',
      columnType: 'integer',
    },
    platinum: {
      type: 'number',
      columnType: 'integer',
    },
    star: {
      type: 'number',
      columnType: 'integer',
    },
    accounts_number: {
      type: 'number',
      columnType: 'integer',
    },
    account: {
      collection: 'account',
      via: 'room',
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

