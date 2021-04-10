/**
 * Tasks.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  datastore: 'clientDb',
  tableName: 'tasks',
  migrate: 'safe',
  attributes: {

    guid: {
      type: 'string',
      unique: true,
    },
    postGuid: {
      type: 'string',
    },
    clientGuid: {
      type: 'string',
    },
    accountGuid: {
      type: 'string',
    },
    messenger: {
      type: 'string',
    },
    /**
     * messageGuid - уникальный идентификатор сообщения
     */
    messageGuid: {
      type: 'string',
      allowNull: true,
    },
    makeLike: {
      type: 'boolean',
    },
    makeComment: {
      type: 'boolean',
    },
    makeLikePerformed: {
      type: 'boolean',
    },
    makeCommentPerformed: {
      type: 'boolean',
    },
    commentText: {
      type: 'string',
      allowNull: true,
    },
    commentNumberOfWords: {
      type: 'number',
      allowNull: true,
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

