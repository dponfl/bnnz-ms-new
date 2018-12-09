"use strict";

const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(sails.config.TELEGRAM_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});


module.exports = {
  getTelegramBot: function () {
    return bot;
  }
};