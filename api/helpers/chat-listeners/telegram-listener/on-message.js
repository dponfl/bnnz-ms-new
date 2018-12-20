"use strict";

const t = require('../../../services/translate');
const generalServices = require('../../../services/general');
const restLinks = generalServices.RESTLinks();


module.exports = {


  friendlyName: 'On message',


  description: 'Manage text Telegram messages',


  inputs: {

  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log.info('telegramListener.onMessage started...');


    sails.config.custom.telegramBot.on('message', async (msg) => {

      sails.log.debug('Message received: ', msg);

      let lang = msg.from.language_code;

      let html = `
<b>${t.t(lang, 'NEW_SUBS_WELCOME_01')}, ${msg.chat.first_name}</b>

<b>${t.t(lang, 'NEW_SUBS_WELCOME_02')}</b>

${t.t(lang, 'NEW_SUBS_WELCOME_03')} 
`;


      let params = {
        messenger: 'telegram',
        chatId: msg.chat.id,
        html: html,
      };

      let res = await sails.helpers.general.sendRest('POST', restLinks.mgSendSimpleMessage, params);



    });

    return exits.success();

  } //fn


};

