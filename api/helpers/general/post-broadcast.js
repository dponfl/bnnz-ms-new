const t = require('../../services/translate').t;
const emoji = require('node-emoji');

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

    sails.log.info('general:postBroadcast helper...');

    // sails.log.info('inputs.accountId: ', inputs.accountId);
    // sails.log.info('inputs.client.accounts[inputs.accountId]: ', inputs.client.accounts[inputs.accountId]);


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

      for (const room of account.room) {
        if (room.active) {
          accoutnRoomsList.push(room.id);
        }
      }

      // sails.log.warn('api/helpers/general/post-broadcast, accoutnRoomsList:', accoutnRoomsList);

      const clientsListRaw = await sails.helpers.storage.getClientsByRooms(accoutnRoomsList);

      // sails.log.warn('api/helpers/general/post-broadcast, clientsListRaw:', clientsListRaw);

      let clientsList;

      if (clientsListRaw.status === 'ok') {
        clientsList = clientsListRaw.payload;
      }

      // sails.log.warn('api/helpers/general/post-broadcast, clientsList:', clientsList);

      for (const clientKey in clientsList) {

        /**
         * Делаем так, чтобы отправитель не получил этого сообщения :)
         */

        const client = clientsList[clientKey];

        if (client.client.id !== inputs.client.id) {

          // sails.log.info('api/helpers/general/post-broadcast, gonna send post to the client: ', client.client.id);

          let useLang = (_.has(sails.config.custom.lang, client.lang) ? client.client.lang : 'ru');
          let htmlPostBroadcast = t(useLang, "MSG_GENERAL_POST_BROADCAST_1") +
            client.account.inst_profile +
            t(useLang, "MSG_GENERAL_POST_BROADCAST_2") +
            sails.config.custom.SCR + inputs.postLink;

          /**
           * Обрабатываем эмодзи
           */

          htmlPostBroadcast = emoji.emojify(htmlPostBroadcast);


          /**
           * Увеличиваем счетчики сообщений, отправленных клиенту
           */

          // sails.log.info('api/helpers/general/post-broadcast, received messages counters: ', {
          //   posts_received_day: client.account.posts_received_day,
          //   posts_received_total: client.account.posts_received_total,
          // });

          await sails.helpers.storage.accountUpdate.with({
            criteria: {id: client.account.id},
            data: {
              posts_received_day: ++client.account.posts_received_day,
              posts_received_total: ++client.account.posts_received_total,
            },
          });

          // sails.log.info('api/helpers/general/post-broadcast, increased posts sent counters for the account: ', client.account.id);

          let simpleRes = await sails.helpers.mgw[inputs.client.messenger]['simpleMessage'].with({
            chatId: client.client.chat_id,
            html: htmlPostBroadcast,
          });

          /**
           * Save the sent message
           */

          await sails.helpers.storage.messageSave.with({
            message: htmlPostBroadcast,
            message_format: 'post broadcast',
            messenger: client.client.messenger,
            message_originator: 'client',
            client_id: client.client.id,
            client_guid: client.client.guid
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
          payload: {},
        }
      };

    }

  }

};

