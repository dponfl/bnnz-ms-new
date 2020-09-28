/**
 * Logs.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'performanceDb',
  tableName: 'performance',
  migrate: 'safe',
  attributes: {

    platform: {
      type: 'string',
    },
    action: {
      type: 'string',
    },
    api: {
      type: 'string',
    },
    requestType: {
      type: 'string',
    },
    status: {
      type: 'string',
    },
    clientGuid: {
      type: 'string',
      allowNull: true,
    },
    accountGuid: {
      type: 'string',
      allowNull: true,
    },
    requestDuration: {
      type: 'number',
    },
    requestDepth: {
      type: 'number',
      allowNull: true,
    },
    comments: {
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

