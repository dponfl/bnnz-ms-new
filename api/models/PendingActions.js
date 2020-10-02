"use strict";

/**
 * PendingActions.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'clientDb',
  tableName: 'pending_actions',
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

    requestId: {
      type: 'string',
    },

    childRequestId: {
      type: 'string',
    },

    pendingActionName: {
      type: 'string',
      required: true,
    },

    /**
     * Кол-во попыток выполнить целевое действие
     */

    actionsPerformed: {
      type: 'number',
    },

    checkInProgress: {
      type: 'boolean',
    },

    done: {
      type: 'boolean',
    },

    deleted: {
      type: 'boolean',
    },

    payload: {
      type: 'json',
    },

    payloadResponse: {
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

