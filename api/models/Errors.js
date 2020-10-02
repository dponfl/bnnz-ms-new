"use strict";

/**
 * Errors.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'performanceDb',
  tableName: 'errors',
  migrate: 'safe',
  attributes: {

    guid: {
      type: 'string',
      unique: true,
    },

    clientGuid: {
      type: 'string',
    },

    accountGuid: {
      type: 'string',
    },

    requestId: {
      type: 'string',
    },

    childRequestId: {
      type: 'string',
    },

    level: {
      type: 'string',
      required: true,
    },

    emergencyLevel: {
      type: 'string',
    },

    errorName: {
      type: 'string',
    },

    message: {
      type: 'string',
      required: true,
    },

    location: {
      type: 'string',
    },

    payload: {
      type: 'json',
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

