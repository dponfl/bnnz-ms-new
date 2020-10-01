"use strict";

/**
 * Payments.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'clientDb',
  tableName: 'payments',
  migrate: 'safe',
  attributes: {
    guid: {
      type: 'string',
      unique: true,
    },
    paymentGroupGuid: {
      type: 'string',
    },
    order: {
      type: 'number',
    },
    /**
     * Размер платежа
     */
    amount: {
      type: 'number',
    },
    /**
     * Валюта платежа
     */
    currency: {
      type: 'string',
    },
    payment_id: {
      type: 'string',
      allowNull: true,
    },
    /**
     * Статус платежа в соответствии с платёжным шлюзом Telegram
     * ('invoice', 'pre_checkout', 'successful_payment')
     */
    payment_status: {
      type: 'string',
    },
    payment_data: {
      type: 'json',
    },
    payment_response: {
      type: 'json',
    },
    comments: {
      type: 'string',
    },
    client_id: {
      model: 'client',
    },
    client_guid: {
      type: 'string',
    },
    account_guid: {
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

