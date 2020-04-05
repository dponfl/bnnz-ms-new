"use strict";

const Joi = require('@hapi/joi');

const parseSpecialTokens = require('../../services/message-processor/parse-special-tokens').parseSpecialTokens;

const t = require('../translate').t;

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

    resultHtml = parseSpecialTokens({
      client: input.client,
      message: resultHtml,
      additionalTokens: input.additionalTokens,
    });

    return resultHtml;

  },

};

