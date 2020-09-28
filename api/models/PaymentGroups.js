"use strict";

/**
 * PaymentGroups.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'paymentDb',
  tableName: 'payment_groups',
  migrate: 'safe',
  attributes: {
    guid: {
      type: 'string',
      unique: true,
    },
    /**
     * Тип: deposit/withdrawal
     */
    type: {
      type: 'string',
    },
    /**
     * Статус
     */
    status: {
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
    /**
     * Наименование платёжного провайдера
     */
    payment_provider: {
      type: 'string',
    },
    messenger: {
      type: 'string',
    },
    /**
     * Наименование блока воронки, на котором нажата кнопка отправки инвойса
     */
    funnel_block: {
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

