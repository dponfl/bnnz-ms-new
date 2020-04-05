"use strict";

const Joi = require('@hapi/joi');

const confObj = require('../translate').getConfigObj;
const emoji = require('node-emoji');

const moduleName = 'message-processor:utils';


module.exports = {

  parseSpecialTokens: function (params) {

    const schema = Joi.object({
      client: Joi
        .any()
        .required(),
      message: Joi
        .string()
        .required(),
      additionalTokens: Joi
        .any(),
    });

    const inputRaw = schema.validate(params);
    const input = inputRaw.value;

    let resultStr = input.message;

    const firstName = input.client.first_name || '';
    const lastName = input.client.last_name || '';

    const configPricePlatinum = confObj(input.client.lang).price.platinum;
    const configPriceGold = confObj(input.client.lang).price.gold;
    const configPriceBronze = confObj(input.client.lang).price.bronze;

    let mandatoryProfileList = '';

    for (let i = 0; i < confObj(input.client.lang).profiles.length; i++) {

      mandatoryProfileList = mandatoryProfileList + `<a href="${confObj(input.client.lang).profiles[i].url}">${confObj(input.client.lang).profiles[i].text}</a>` + sails.config.custom.SCR;

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

    const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
    const profileOfCurrentAccount = currentAccount.inst_profile;
    resultStr = _.replace(resultStr, '$CurrentAccount$', profileOfCurrentAccount);

    /**
     * Кол-во сообщений, отправленных с текущего аккаунта за сутки
     */

    const numberOfMessagesSentToday = currentAccount.posts_made_day;
    resultStr = _.replace(resultStr, '$PostsSent$', numberOfMessagesSentToday);

    if (input.additionalTokens != null) {

      _.forEach(input.additionalTokens, (elem) => {

        resultStr = _.replace(resultStr, elem.token, elem.value);

      });

    }

    resultStr = emoji.emojify(resultStr, () => '');

    return resultStr;

  },
};
