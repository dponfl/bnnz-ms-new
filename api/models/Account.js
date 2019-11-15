"use strict";

/**
 * Account.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'account',
  migrate: 'safe',
  attributes: {
    guid: {
      type: 'string',
      unique: true,
    },
    subscription_active: {
      type: 'boolean',
    },
    subscription_from: {
      type: 'string',
      columnType: 'datetime',
      allowNull: true,
    },
    subscription_until: {
      type: 'string',
      columnType: 'datetime',
      allowNull: true,
    },
    deleted: {
      type: 'boolean',
    },
    inst_profile: {
      type: 'string',
    },
    posts_made_day: {
      type: 'number',
      columnType: 'integer',
    },
    posts_received_day: {
      type: 'number',
      columnType: 'integer',
    },
    posts_made_total: {
      type: 'number',
      columnType: 'integer',
    },
    posts_received_total: {
      type: 'number',
      columnType: 'integer',
    },
    profile_provided: {
      type: 'boolean',
    },
    profile_confirmed: {
      type: 'boolean',
    },
    payment_plan_selected: {
      type: 'boolean',
    },
    payment_plan: {
      type: 'string',
      allowNull: true,
    },
    payment_made: {
      type: 'boolean',
    },
    subscription_confirmed_by_client: {
      type: 'boolean',
    },
    subscription_made: {
      type: 'boolean',
    },
    service_subscription_finalized: {
      type: 'boolean',
    },
    client: {
      model: 'client',
    },
    room: {
      collection: 'room',
      via: 'account',
    },
    service: {
      model: 'service',
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

