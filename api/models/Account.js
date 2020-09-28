"use strict";

/**
 * Account.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'clientDb',
  tableName: 'account',
  migrate: 'safe',
  attributes: {
    guid: {
      type: 'string',
      unique: true,
    },
    ref_key: {
      type: 'string',
      unique: true,
    },
    region: {
      type: 'string',
    },

    /**
     * флаг, что клиент пожелал подключить этот акаунт к реферальной программе
     */
    is_ref: {
      type: 'boolean',
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

    service: {
      model: 'service',
    },

    /**
     * Сумма у оплате при выставлении инвойса в мин единицах (копейки, центы и т.п.)
     */
    payment_amount: {
      type: 'number',
      allowNull: true,
    },

    /**
     * Валюта инвойса
     */
    payment_currency: {
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
     * начало следующего оплаченного периода
     */
    next_subscription_from: {
      type: 'string',
      // columnType: 'datetime',
      allowNull: true,
    },

    /**
     * окончание следующего оплаченного периода
     */
    next_subscription_until: {
      type: 'string',
      // columnType: 'datetime',
      allowNull: true,
    },

    next_service: {
      model: 'service',
    },

    /**
     * наименование следующего уровня сервиса, который выбрал клиент
     */
    next_payment_plan: {
      type: 'string',
      allowNull: true,
    },

    /**
     * флаг того, что клиент произвёл оплату следующего выбранного уровня сервиса
     */
    next_payment_made: {
      type: 'boolean',
    },

    /**
     * флаг, что аккаунт удален из сервиса
     */
    deleted: {
      type: 'boolean',
    },

    /**
     * флаг, что аккаунт забаненposts_received_day
     */
    banned: {
      type: 'boolean',
    },

    /**
     * Инстаграм профайл аккаунта клиента
     */
    inst_profile: {
      type: 'string',
    },

    inst_id: {
      type: 'string',
      allowNull: true,
    },

    inst_pic: {
      type: 'string',
      allowNull: true,
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
     * количество лайков, которые должен поставить аккаунт всего
     */
    requested_likes_total: {
      type: 'number',
      columnType: 'integer',
    },

    /**
     * количество лайков, которые аккаунт поставил  всего
     */
    made_likes_total: {
      type: 'number',
      columnType: 'integer',
    },

    /**
     * количество комментариев, которые аккаунт должен оставить всего
     */
    requested_comments_total: {
      type: 'number',
      columnType: 'integer',
    },

    /**
     * количество комментариев, которые аккаунт оставил  всего
     */
    made_comments_total: {
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

    /**
     * Наименование текущей клавиатуры (keyboardBlock::keyboardId)
     * (используется для проверки валидности поступающего сообщения в контексте)
     */

    keyboard: {
      type: 'string',
      allowNull: true,
    },

    /**
     * Эта группа данных прогружается в Client при смене тек. аккаунта
     */
    // funnel_name: {
    //   type: 'string',
    //   allowNull: true,
    // },
    // current_funnel: {
    //   type: 'string',
    //   allowNull: true,
    // },
    // funnels: {
    //   type: 'json',
    // },

    client: {
      model: 'client',
    },
    room: {
      collection: 'room',
      via: 'account',
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

