"use strict";

const Joi = require('@hapi/joi');

const emoji = require('node-emoji');

const t = require('./translate').t;

const moduleName = 'KeyboardProcessor';


module.exports = {

  parseMessageStyle: function (params) {

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

      resultHtml = KeyboardProcessor.parseSpecialTokens({
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
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  },

  parseStr: function(params) {

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

      resStr = KeyboardProcessor.parseSpecialTokens({
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
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  },

  parseSpecialTokens: function (params) {

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
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  },

  mapButtonsDeep: function mapButtonsDeep(params) {

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
        const arr = input.buttons.map((innerObj) => mapButtonsDeep({
          client: input.client,
          buttons: innerObj,
          additionalTokens: input.additionalTokens,
        }));

        return arr;

      } else if (_.isObject(input.buttons)) {
        let buttonText = '';
        _.forEach(input.buttons, (val, key) => {
          if (key === 'text') {
            buttonText = MessageProcessor.parseSpecialTokens({
              client: input.client,
              message: t(input.client.lang, val),
              additionalTokens: input.additionalTokens,
            });
          }
        });

        return buttonText;

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
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  },

  parseButtonActions: function (params) {

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
        _.forEach(elem, (val, key) => {
          if (key === 'text') {
            ob[key] = KeyboardProcessor.parseSpecialTokens({
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
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  },

};
