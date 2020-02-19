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
    client_guid: {
      type: 'string',
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
     * количество созданных заданий на лайки
     */
    requested_likes: {
      type: 'number',
    },
    /**
     * количество созданных заданий на комментарии
     */
    requested_comments: {
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

