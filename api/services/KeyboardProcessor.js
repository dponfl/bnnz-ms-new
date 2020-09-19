"use strict";

const Joi = require('@hapi/joi');

const emoji = require('node-emoji');

const t = require('./translate').t;

const moduleName = 'KeyboardProcessor';


module.exports = {

  parseMessageStyle: async function (params) {

    const methodName = 'parseMessageStyle';

    const schema = Joi.object({
      client: Joi.any().required(),
      message: Joi.any().required(),
      additionalTokens: Joi.any(),
    });

    let input;

    try {

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      let resultHtml = '';

      for (let i = 0; i < input.message.html.length; i++) {
        resultHtml = resultHtml +
          (/b/i.test(input.message.html[i].style) ? '<b>' : '') +
          (/i/i.test(input.message.html[i].style) ? '<i>' : '') +
          t(input.client.lang, input.message.html[i].text) +
          (/i/i.test(input.message.html[i].style) ? '</i>' : '') +
          (/b/i.test(input.message.html[i].style) ? '</b>' : '') +
          (input.message.html.length > 1
            ? (input.message.html[i].cr
              ? sails.config.custom[input.message.html[i].cr]
              : '')
            : '');
      }

      resultHtml = await KeyboardProcessor.parseSpecialTokens({
        client: input.client,
        message: resultHtml,
        additionalTokens: input.additionalTokens,
      });

      return resultHtml;

    } catch (e) {

      // const errorMsg = 'General error';
      //
      // sails.log.error(`${moduleName}:${methodName}, Error details:
      // Platform error message: ${errorMsg}
      // Error name: ${e.name || 'no name'}
      // Error message: ${e.message || 'no message'}
      // Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);
      //
      // throw {err: {
      //     module: `${moduleName}:${methodName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName}:${methodName} performed`,
          payload: {},
        });
      }

    }

  },

  parseStr: async function(params) {

    const methodName = 'parseStr';

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

    let input;

    try {

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      let resStr = t(input.client.lang, input.token);

      resStr = await KeyboardProcessor.parseSpecialTokens({
        client: input.client,
        message: resStr,
        additionalTokens: input.additionalTokens,
      });

      return resStr;

    } catch (e) {

      // const errorMsg = 'General error';
      //
      // sails.log.error(`${moduleName}:${methodName}, Error details:
      // Platform error message: ${errorMsg}
      // Error name: ${e.name || 'no name'}
      // Error message: ${e.message || 'no message'}
      // Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);
      //
      // throw {err: {
      //     module: `${moduleName}:${methodName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName}:${methodName} performed`,
          payload: {},
        });
      }

    }

  },

  parseEmoji: async function(params) {

    const methodName = 'parseEmoji';

    const schema = Joi.object({
      str: Joi
        .string()
        .description('string to parse emoji in')
        .required(),
    });

    let input;
    let resultStr;

    try {

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      resultStr = emoji.emojify(input.str, () => '');

      return resultStr;

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName}:${methodName} performed`,
          payload: {},
        });
      }

    }

  },

  parseSpecialTokens: async function (params) {

    const methodName = 'parseSpecialTokens';

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

    let input;

    try {

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      let resultStr = input.message;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentRegion = currentAccount.region;
      const currentServiceName = currentAccount.service.name;

      const firstName = input.client.first_name || '';
      const lastName = input.client.last_name || '';

      const useLang = (_.has(sails.config.custom.config.lang, input.client.lang) ? input.client.lang : 'ru');

      const priceConfigText = sails.config.custom.config.lang[useLang].price;
      const priceConfigGeneral = sails.config.custom.config.price;

      const currentAmount = priceConfigGeneral[currentRegion][currentServiceName].period_01.current_price;
      const listAmount = priceConfigGeneral[currentRegion][currentServiceName].period_01.list_price;
      const currentCurrency = priceConfigGeneral[currentRegion].currency;
      const currentCurrencyText = priceConfigText.currency[currentCurrency];
      const currentServiceLevelTitle = priceConfigText.service_title[currentServiceName].title;

      resultStr = _.replace(resultStr, '$FirstName$', firstName);
      resultStr = _.replace(resultStr, '$LastName$', lastName);

      resultStr = _.replace(resultStr, '$PriceCurrent$', `${currentAmount} ${currentCurrencyText}`);
      resultStr = _.replace(resultStr, '$PriceList$', `${listAmount} ${currentCurrencyText}`);

      resultStr = _.replace(resultStr, '$ServiceLevelTitle$', `${currentServiceLevelTitle}`);

      const profileOfCurrentAccount = currentAccount.inst_profile;
      resultStr = _.replace(resultStr, '$CurrentAccount$', profileOfCurrentAccount);

      resultStr = _.replace(resultStr, '$SCR$', sails.config.custom.SCR);
      resultStr = _.replace(resultStr, '$DCR$', sails.config.custom.DCR);

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

    } catch (e) {

      // const errorMsg = 'General error';
      //
      // sails.log.error(`${moduleName}:${methodName}, Error details:
      // Platform error message: ${errorMsg}
      // Error name: ${e.name || 'no name'}
      // Error message: ${e.message || 'no message'}
      // Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);
      //
      // throw {err: {
      //     module: `${moduleName}:${methodName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName}:${methodName} performed`,
          payload: {},
        });
      }

    }

  },

  mapButtonsDeep: async function mapButtonsDeep(params) {

    const methodName = 'mapButtonsDeep';

    const schema = Joi.object({
      client: Joi
        .any()
        .required(),
      buttons: Joi
        .any()
        .required(),
      additionalTokens: Joi
        .any(),
    });

    let input;

    try {

      const inputRaw = schema.validate(params);
      input = inputRaw.value;

      if (_.isArray(input.buttons)) {
        const arr = input.buttons.map(async (innerObj) => await mapButtonsDeep({
          client: input.client,
          buttons: innerObj,
          additionalTokens: input.additionalTokens,
        }));

        return Promise.all(arr)
          .then(res => {
            return res;
          });

        // return arr;

      } else if (_.isObject(input.buttons)) {
        const ob = {};
        _.forEach(input.buttons, async (val, key) => {
          if (key === 'text') {
            ob[key] = await KeyboardProcessor.parseSpecialTokens({
              client: input.client,
              message: t(input.client.lang, val),
              additionalTokens: input.additionalTokens,
            });
          } else {
            ob[key] = val;
          }
        });

        return ob;

      }

    } catch (e) {

      // const errorMsg = 'General error';
      //
      // sails.log.error(`${moduleName}:${methodName}, Error details:
      // Platform error message: ${errorMsg}
      // Error name: ${e.name || 'no name'}
      // Error message: ${e.message || 'no message'}
      // Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);
      //
      // throw {err: {
      //     module: `${moduleName}:${methodName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName}:${methodName} performed`,
          payload: {},
        });
      }

    }

  },

  parseButtonActions: async function (params) {

    const methodName = 'parseButtonActions';

    const schema = Joi.object({
      client: Joi
        .any()
        .required(),
      buttons: Joi
        .any()
        .required(),
      additionalTokens: Joi
        .any(),
    });

    let input;

    try {

      const inputRaw = schema.validate(params);

      input = inputRaw.value;

      let flattenButtons = _.flattenDeep(input.buttons);

      let res = [];

      flattenButtons.map((elem) => {

        const ob = {};
        _.forEach(elem, async (val, key) => {
          if (key === 'text') {
            ob[key] = await KeyboardProcessor.parseSpecialTokens({
              client: input.client,
              message: t(input.client.lang, val),
              additionalTokens: input.additionalTokens,
            });
          } else {
            ob[key] = val;
          }
        });

        res.push(ob);

      });

      return res;

    } catch (e) {

      // const errorMsg = 'General error';
      //
      // sails.log.error(`${moduleName}:${methodName}, Error details:
      // Platform error message: ${errorMsg}
      // Error name: ${e.name || 'no name'}
      // Error message: ${e.message || 'no message'}
      // Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);
      //
      // throw {err: {
      //     module: `${moduleName}:${methodName}`,
      //     message: errorMsg,
      //     payload: {
      //       error_name: e.name || 'no name',
      //       error_message: e.message || 'no message',
      //       error_stack: e.stack || {},
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: `${moduleName}:${methodName}`,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName}:${methodName} performed`,
          payload: {},
        });
      }

    }

  },

};
