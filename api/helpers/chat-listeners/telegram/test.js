"use strict";

const _ = require('lodash');


module.exports = {


  friendlyName: 'Test bot',


  description: 'Test bot',


  inputs: {

  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: 'Error',
    }

  },


  fn: async function (inputs, exits) {

    sails.log.info('******************** api/helpers/chat-listeners/telegram/test.js ********************');

    sails.config.custom.telegramBot.on('text', async (msg) => {


      try {

        const getClientRaw = await sails.helpers.storage.clientGet.with({
          messenger: 'telegram',
          msg: msg
        });

        if (getClientRaw.status !== 'found') {
          throw new Error(`Client not found, msg: ${msg}`);
        }

        const client = getClientRaw.payload;

        if (_.trim(msg.text).match(/^pay$/i)) {

          const paymentProvider = sails.config.custom.config.payments[client.messenger]['provider'].toLowerCase();

          if (paymentProvider == null) {
            throw new Error(`No payment provider, config: ${msg}`);
          }

          const paymentResult = await sails.helpers.pgw[paymentProvider]['sendInvoice'].with({
            messenger: client.messenger,
            chatId: client.chat_id,
            title: 'SocialGrowth "Супе-дупер пакет"',
            description: 'Подписка на сервис SocialGrowth "Супе-дупер пакет" на 1 месяц',
            payload: 'payload',
            startParameter: 'start',
            currency: 'RUB',
            prices: [
              {
                label: 'Наименование товара',
                amount: '100.77',
              }
            ],
            clientId: client.id,
            clientGuid: client.guid,
          });

        }

      } catch (err) {

        sails.log.error('Test bot error: ', err);

      }

    });

    /**
     * The below return needed for normal functioning of config/bootstrap.js
     */

    return exits.success({
      status: 'ok',
      message: 'success',
      payload: {}
    });

  } //fn

};


