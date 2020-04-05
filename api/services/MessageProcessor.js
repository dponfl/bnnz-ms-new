"use strict";

const Joi = require('@hapi/joi');

const confObj = require('./translate').getConfigObj;
const emoji = require('node-emoji');

const t = require('./translate').t;

const moduleName = 'message-processor:utils';


module.exports = {

  parseMessageStyle: function (params) {

    const schema = Joi.object({
      client: Joi.any().required(),
      message: Joi.any().required(),
      additionalTokens: Joi.any(),
    });

    const inputRaw = schema.validate(params);
    const input = inputRaw.value;

    let resultHtml = '';

    for (let i = 0; i < input.message.html.length; i++) {
      resultHtml = resultHtml +
        (/b/i.test(input.message.html[i].style) ? '<b>' : '') +
        (/i/i.test(input.message.html[i].style) ? '<i>' : '') +
        (/url/i.test(input.message.html[i].style) ? `<a href="${input.message.html[i].url}">` : '') +
        t(input.client.lang, input.message.html[i].text) +
        (/i/i.test(input.message.html[i].style) ? '</i>' : '') +
        (/b/i.test(input.message.html[i].style) ? '</b>' : '') +
        (/url/i.test(input.message.html[i].style) ? '</a>' : '') +
        (input.message.html.length > 1
          ? (input.message.html[i].cr
            ? sails.config.custom[input.message.html[i].cr]
            : '')
          : '');
    }

    resultHtml = MessageProcessor.parseSpecialTokens({
      client: input.client,
      message: resultHtml,
      additionalTokens: input.additionalTokens,
    });

    return resultHtml;

  },

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

  mapDeep: function mapDeep(params) {

    const schema = Joi.object({
      client: Joi
        .any()
        .required(),
      data: Joi
        .any()
        .required(),
      additionalTokens: Joi
        .any(),
    });

    const inputRaw = schema.validate(params);
    const input = inputRaw.value;

    if (_.isArray(input.data)) {
      const arr = input.data.map((innerObj) => mapDeep({
        client: input.client,
        data: innerObj,
        additionalTokens: input.additionalTokens,
      }));

      return arr;

    } else if (_.isObject(input.data)) {
      let ob = _.forEach(input.data, (val, key, o) => {
        if (key === 'text' || key === 'url') {
          o[key] = MessageProcessor.parseSpecialTokens({
            client: input.client,
            message: t(input.client.lang, val),
            additionalTokens: input.additionalTokens,
          });
        }
      });

      return ob;

    }

  },


};
