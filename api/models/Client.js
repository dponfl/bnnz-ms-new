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
    subscription_url: {
      type: 'string',
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
      collection: 'message',
      via: 'client_id',
    },
    rooms: {
      collection: 'room',
      via: 'user',
    },
    service: {
      model: 'service',
    },
    lang: {
      type: 'string',
    },
    inst_profile: {
      type: 'string',
    },
    current_funnel: {
      type: 'string',
    },
    funnels: {
      type: 'json',
    },
    start_msg_01_shown: {
      type: 'boolean',
    },
    start_msg_02_shown: {
      type: 'boolean',
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

