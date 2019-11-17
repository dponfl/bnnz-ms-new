"use strict";

/**
 * Payments.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'payments',
  migrate: 'safe',
  attributes: {

    /**
     * Тип платежа: deposit/withdrawal
     */
    type: {
      type: 'string',
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
    /**
     * Наименование платёжного провайдера
     */
    payment_provider: {
      type: 'string',
    },
    messenger: {
      type: 'string',
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

