const t = require('../../services/translate').t;

module.exports = {


  friendlyName: 'Post broadcast',


  description: 'Sent out the post made by user to all citizens of his rooms',


  inputs: {
    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    accountId: {
      friendlyName: 'accountId',
      description: 'accountId',
      type: 'number',
      required: true,
    },
    postLink: {
      friendlyName: 'postLink',
      description: 'postLink',
      type: 'string',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log('general:postBroadcast helper...');

    try {

      const account = inputs.client.accounts[inputs.accountId];

      if (account == null) {
        sails.log.error('api/helpers/general/post-broadcast, error: Cannot find account by input.accountId');
        throw new Error('api/helpers/general/post-broadcast, error: Cannot find account by input.accountId');
      }

      /**
       * Check if the account has the active subscription
       */

      if (!account.subscription_active) {
        sails.log.error('api/helpers/general/post-broadcast: Account has not active subscription', {
          accountId: inputs.accountId,
          subscription_active: account.subscription_active,
        });
        return exits.success({
          status: 'nok',
          message: 'Account has not active subscription',
          payload: {
            accountId: inputs.accountId,
            subscription_active: account.subscription_active,
          },
        });
      }

      /**
       * Check if the client reached the max outgoing posts on active account
       */

      if (account.posts_made_day >= account.service.max_outgoing_posts_per_day) {
        sails.log.error('api/helpers/general/post-broadcast: Max amount of outgoing posts reached', {
          posts_made_day: account.posts_made_day,
          max_outgoing_posts_per_day: account.service.max_outgoing_posts_per_day,
        });
        return exits.success({
          status: 'nok',
          message: 'Max amount of outgoing posts reached',
          payload: {
            posts_made_day: account.posts_made_day,
            max_outgoing_posts_per_day: account.service.max_outgoing_posts_per_day,
          },
        });
      }

      /**
       * Collect list of all clients living in the rooms of this account
       */

      const accoutnRoomsList = [];

      for (const room in account.room) {
        if (room.active) {
          accoutnRoomsList.push(room.id);
        }
      }

      sails.log.warn('api/helpers/general/post-broadcast, accoutnRoomsList:', accoutnRoomsList);

      const clientsListRaw = await sails.helpers.storage.getClientsByRooms(accoutnRoomsList);

      sails.log.warn('api/helpers/general/post-broadcast, clientsListRaw:', clientsListRaw);

      let clientsList;

      if (clientsListRaw.status === 'ok') {
        clientsList = clientsListRaw.payload;
      }

      sails.log.warn('api/helpers/general/post-broadcast, clientsList:', clientsList);

      for (const client in clientsList) {

        /**
         * Делаем так, чтобы отправитель не получил этого сообщения :)
         */

        if (client.client.id !== inputs.client.id) {
          let useLang = (_.has(sails.config.custom.lang, client.lang) ? client.client.lang : 'ru');
          let htmlPostBroadcast = t(useLang, "MSG_GENERAL_POST_BROADCAST_1") +
            client.account.inst_profile +
            t(useLang, "MSG_GENERAL_POST_BROADCAST_2") +
            sails.config.custom.SCR + inputs.postLink;

          /**
           * Увеличиваем счетчики сообщений, отправленных клиенту
           */

          await sails.helpers.storage.accountUpdate.with({
            criteria: {id: client.account.id},
            data: {
              posts_received_day: client.account.posts_received_day++,
              posts_received_total: client.account.posts_received_total++,
            },
          });

          let simpleRes = await sails.helpers.mgw[inputs.client.messenger]['simpleMessage'].with({
            chatId: client.client.chat_id,
            html: htmlPostBroadcast,
          });
        }
      }

      return exits.success({
        status: 'ok',
        message: 'postBroadcast performed',
        payload: {}
      });

    } catch (e) {

      sails.log.error('api/helpers/general/post-broadcast, error: ', e);

      throw {err: {
          module: 'api/helpers/general/post-broadcast',
          message: sails.config.custom.GENERAL_HELPER_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

  }

};
