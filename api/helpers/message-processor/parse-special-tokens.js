"use strict";

const confObj = require('../../services/translate').getConfigObj;
const emoji = require('node-emoji');

const moduleName = 'message-processor:parse-special-tokens';


module.exports = {


  friendlyName: 'message-processor:parse-special-tokens',


  description: 'Parse special tokens for message',


  inputs: {

    client: {
      friendlyName: 'client record',
      description: 'client record',
      type: 'ref',
      required: true,
    },

    message: {
      friendlyName: 'message',
      description: 'message',
      type: 'ref',
      required: true,
    },

    additionalTokens: {
      friendlyName: 'array of pairs token-value',
      description: 'array of pairs token-value',
      type: 'ref',
    },

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

    try {

      let resultStr = inputs.message;

      const firstName = inputs.client.first_name || '';
      const lastName = inputs.client.last_name || '';

      const configPricePlatinum = confObj(inputs.client.lang).price.platinum;
      const configPriceGold = confObj(inputs.client.lang).price.gold;
      const configPriceBronze = confObj(inputs.client.lang).price.bronze;

      let mandatoryProfileList = '';

      for (let i = 0; i < confObj(inputs.client.lang).profiles.length; i++) {

        mandatoryProfileList = mandatoryProfileList + `<a href="${confObj(inputs.client.lang).profiles[i].url}">${confObj(inputs.client.lang).profiles[i].text}</a>` + sails.config.custom.SCR;

      }

      mandatoryProfileList = mandatoryProfileList + sails.config.custom.DCR;


      resultStr = _.replace(resultStr, '$FirstName$', firstName);
      resultStr = _.replace(resultStr, '$LastName$', lastName);

      resultStr = _.replace(resultStr, '$PricePlatinum$', `${configPricePlatinum.text}: ${configPricePlatinum.value_text} ${configPricePlatinum.currency_text}/${configPricePlatinum.period_text}`);
      resultStr = _.replace(resultStr, '$PriceGold$', `${configPriceGold.text}: ${configPriceGold.value_text} ${configPriceGold.currency_text}/${configPriceGold.period_text}`);
      resultStr = _.replace(resultStr, '$PriceBronze$', `${configPriceBronze.text}: ${configPriceBronze.value_text} ${configPriceBronze.currency_text}/${configPriceBronze.period_text}`);

      resultStr = _.replace(resultStr, '$NamePlatinum$', `${configPricePlatinum.text}`);
      resultStr = _.replace(resultStr, '$NameGold$', `${configPriceGold.text}`);
      resultStr = _.replace(resultStr, '$NameBronze$', `${configPriceBronze.text}`);

      resultStr = _.replace(resultStr, '$MandatoryProfiles$', mandatoryProfileList);

      const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});
      const profileOfCurrentAccount = currentAccount.inst_profile;
      resultStr = _.replace(resultStr, '$CurrentAccount$', profileOfCurrentAccount);

      /**
       * Кол-во сообщений, отправленных с текущего аккаунта за сутки
       */

      const numberOfMessagesSentToday = currentAccount.posts_made_day;
      resultStr = _.replace(resultStr, '$PostsSent$', numberOfMessagesSentToday);

      if (inputs.additionalTokens != null) {

        _.forEach(inputs.additionalTokens, (elem) => {

          resultStr = _.replace(resultStr, elem.token, elem.value);

        });

      }

      resultStr = emoji.emojify(resultStr, () => '');

      return exits.success(resultStr);

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

    }

  }

};

