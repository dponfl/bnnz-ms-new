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

  parseStr: function(params) {

    const schema = Joi.object({
      client: Joi
        .any()
        .required(),
      token: Joi
        .any()
        .required(),
      additionalTokens: Joi
        .any(),
    });

    const inputRaw = schema.validate(params);
    const input = inputRaw.value;

    let resStr = t(input.client.lang, input.token);

    resStr = MessageProcessor.parseSpecialTokens({
      client: input.client,
      message: resStr,
      additionalTokens: input.additionalTokens,
    });

    return resStr;

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

    const useLang = (_.has(sails.config.custom.config.lang, input.client.lang) ? input.client.lang : 'ru');

    const priceConfigText = sails.config.custom.config.lang[useLang].price;
    const priceConfigGeneral = sails.config.custom.config.price;


    resultStr = _.replace(resultStr, '$FirstName$', firstName);
    resultStr = _.replace(resultStr, '$LastName$', lastName);

    resultStr = _.replace(resultStr, '$PriceBeHeroPeriod01RubCurrent$', `${priceConfigGeneral.RUB.silver_personal.period_01.current_price} ${priceConfigText.currency.RUB}`);
    resultStr = _.replace(resultStr, '$PriceBeHeroPeriod01RubList$', `${priceConfigGeneral.RUB.silver_personal.period_01.list_price} ${priceConfigText.currency.RUB}`);

    resultStr = _.replace(resultStr, '$BeHeroTitle$', `${priceConfigText.service_title.silver_personal.title}`);

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
