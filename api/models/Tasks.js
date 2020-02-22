/**
 * Tasks.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'tasks',
  migrate: 'safe',
  attributes: {

    guid: {
      type: 'string',
      unique: true,
    },
    post_guid: {
      type: 'string',
    },
    client_guid: {
      type: 'string',
    },
    account_guid: {
      type: 'string',
    },
    messenger: {
      type: 'string',
    },
    /**
     * message_id - уникальный идентификатор сообщения внутри мессенджера
     */
    message_id: {
      type: 'string',
    },
    make_like: {
      type: 'boolean',
    },
    make_comment: {
      type: 'boolean',
    },
    make_like_performed: {
      type: 'boolean',
    },
    make_comment_performed: {
      type: 'boolean',
    },
    comment_text: {
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

