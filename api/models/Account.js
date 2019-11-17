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
    /**
     * флаг, что онбординг полностью завершен и сервис оплачен
     */
    subscription_active: {
      type: 'boolean',
    },
    /**
     * начало оплаченного периода
     */
    subscription_from: {
      type: 'string',
      // columnType: 'datetime',
      allowNull: true,
    },
    /**
     * окончание оплаченного периода
     */
    subscription_until: {
      type: 'string',
      // columnType: 'datetime',
      allowNull: true,
    },
    /**
     * флаг, что аккаунт удален из сервиса
     */
    deleted: {
      type: 'boolean',
    },
    /**
     * Инстаграм профайл аккаунта клиента
     */
    inst_profile: {
      type: 'string',
    },
    /**
     * количество постов сделанных с этого аккаунта в текущие сутки
     */
    posts_made_day: {
      type: 'number',
      columnType: 'integer',
    },
    /**
     * количество постов, полученных на текущем аккаунте в текущие сутки
     */
    posts_received_day: {
      type: 'number',
      columnType: 'integer',
    },
    /**
     * общее количество постов сделанных на текущем аккаунте за всё время
     */
    posts_made_total: {
      type: 'number',
      columnType: 'integer',
    },
    /**
     * общее количество постов полученных на текущем аккаунте за всё время
     */
    posts_received_total: {
      type: 'number',
      columnType: 'integer',
    },
    /**
     * количество лайков, которые должен поставить аккаунт в текущие сутки
     */
    requested_likes_day: {
      type: 'number',
      columnType: 'integer',
    },
    /**
     * количество лайков, которые аккаунт поставил за текущие сутки
     */
    made_likes_day: {
      type: 'number',
      columnType: 'integer',
    },
    /**
     * количество комментариев, которые аккаунт должен оставить в текущие сутки
     */
    requested_comments_day: {
      type: 'number',
      columnType: 'integer',
    },
    /**
     * количество комментариев, которые аккаунт оставил за текущие сутки
     */
    made_comments_day: {
      type: 'number',
      columnType: 'integer',
    },
    /**
     * флаг того, что клиент указал свой Инстаграм профиль
     */
    profile_provided: {
      type: 'boolean',
    },
    /**
     * флаг того, что клиент подтвердил указанный Инстаграм профиль
     */
    profile_confirmed: {
      type: 'boolean',
    },
    /**
     * флаг того, что клиент выбрал уровень сервиса
     */
    payment_plan_selected: {
      type: 'boolean',
    },
    /**
     * наименование уровня сервиса, который выбрал клиент
     */
    payment_plan: {
      type: 'string',
      allowNull: true,
    },
    /**
     * флаг того, что клиент произвёл оплату выбранного уровня сервиса
     */
    payment_made: {
      type: 'boolean',
    },
    /**
     * флаг того, что клиент подтвердил свою подписку на список Инстаграм профилей
     */
    subscription_confirmed_by_client: {
      type: 'boolean',
    },
    /**
     * флаг того, что подписка на список Инстаграм профилей проверена
     */
    subscription_made: {
      type: 'boolean',
    },
    /**
     * флаг того, что онбординг завершен
     */
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

