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
    accounts_to_make_likes: {
      type: 'json',
    },
    accounts_to_make_comments: {
      type: 'json',
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

