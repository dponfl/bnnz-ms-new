"use strict";

/**
 * Posts.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'clientDb',
  tableName: 'posts',
  migrate: 'safe',
  attributes: {

    guid: {
      type: 'string',
      unique: true,
    },
    clientGuid: {
      type: 'string',
    },
    accountGuid: {
      type: 'string',
    },
    postLink: {
      type: 'string',
    },
    shortCode: {
      type: 'string',
    },
    mediaId: {
      type: 'string',
    },
    /**
     * количество внутренних лайков
     */
    totalLikes: {
      type: 'number',
    },
    /**
     * количество внутренних дизлайков
     */
    totalDislikes: {
      type: 'number',
    },
    /**
     * количество созданных заданий на лайки
     */
    requestedLikes: {
      type: 'number',
    },
    /**
     * количество созданных заданий на комментарии
     */
    requestedComments: {
      type: 'number',
    },
    /**
     * количество полученных лайков
     */
    receivedLikes: {
      type: 'number',
    },
    /**
     * количество оставленных комментариев
     */
    receivedComments: {
      type: 'number',
    },
    /**
     * true если каждый аккаунт, кому было поручено поставил лайк
     */
    allLikesDone: {
      type: 'boolean',
    },
    /**
     * true если каждый аккаунт, кому было поручено оставил комментарий
     */
    allCommentsDone: {
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

