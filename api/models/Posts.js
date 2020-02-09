"use strict";

/**
 * Posts.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'posts',
  migrate: 'safe',
  attributes: {

    guid: {
      type: 'string',
      unique: true,
    },
    messenger: {
      type: 'string',
    },
    /**
     * message_id - уникальный идентификатор сообщения внутри мессенджера
     */
    message_id: {
      type: 'number',
    },
    account_guid: {
      type: 'string',
    },
    link: {
      type: 'string',
    },
    /**
     * количество внутренних лайков
     */
    total_likes: {
      type: 'number',
    },
    /**
     * количество внутренних дизлайков
     */
    total_dislikes: {
      type: 'number',
    },
    /**
     * количество полученных лайков
     */
    received_likes: {
      type: 'number',
    },
    /**
     * количество оставленных комментариев
     */
    received_comments: {
      type: 'number',
    },
    /**
     * true если каждый аккаунт, кому было поручено поставил лайк
     */
    all_likes_done: {
      type: 'boolean',
    },
    /**
     * true если каждый аккаунт, кому было поручено оставил комментарий
     */
    all_comments_done: {
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

