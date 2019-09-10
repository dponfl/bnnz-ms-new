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

    sails.log.info('******************** telegramListener.test ********************');

    sails.config.custom.telegramBot.on('message', async (msg) => {


      try {

        if (_.trim(msg.text).match(/^pay$/i)) {

          // await sails.helpers.mgw.telegram['simpleMessage'].with({
          //   chatId: msg.chat.id,
          //   html: `Payment gateway name: ${sails.config.custom.config.pgw.name}`,
          // });

          const paymentResult = await sails.helpers.mgw.telegram.pgw.sendInvoice.with({
            chatId: msg.chat.id,
            title: 'SocialGrow Platinum 1 месяц',
            description: 'Подписка на сервис SocialGrow Platinum на 1 месяц',
            payload: 'payload string',
            startParameter: 'startParameter string',
            currency: 'RUB',
            prices: [
              {
                label: '',
                amount: 10000,
              }
            ],
            options: {
              need_name: true,
              need_phone_number: true,
              need_email: true,
              send_phone_number_to_provider: true,
              send_email_to_provider: true,
              provider_data: {
                receipt: {
                  items: [
                    {
                      description: 'Подписка на сервис SocialGrow Platinum на 1 месяц',
                      quantity: '1.00',
                      amount: {
                        value: '100.00',
                        currency: 'RUB',
                      },
                      vat_code: 1,
                    },
                  ],
                },
              },
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: 'Оплатить: 100.00 руб.',
                      callback_data: 'payment_made',
                      pay: true,
                    }
                  ]
                ]
              }
            }
          })

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


