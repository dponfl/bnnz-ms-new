"use strict";

const Joi = require('@hapi/joi');

const t = require('../../services/translate').t;

const moduleName = 'message-processor:parse-message-style-joi';


module.exports = {


  friendlyName: 'message-processor:parse-message-style-joi',


  description: 'Parse message style elements',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
      type: 'ref',
      required: true,
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

    const schema = Joi.object({
      client: Joi.any().required(),
      message: Joi.any().required(),
      additionalTokens: Joi.any(),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

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

      resultHtml = await sails.helpers.messageProcessor.parseSpecialTokensJoi({
        client: input.client,
        message: input.message,
        additionalTokens: input.additionalTokens,
      });

      return exits.success(resultHtml);

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};

