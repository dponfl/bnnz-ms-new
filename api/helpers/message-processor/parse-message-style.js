"use strict";

const t = require('../../services/translate').t;

const moduleName = 'message-processor:parse-message-style';


module.exports = {


  friendlyName: 'message-processor:parse-message-style',


  description: 'Parse message style elements',


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

      let resultHtml = '';

      for (let i = 0; i < inputs.message.html.length; i++) {
        resultHtml = resultHtml +
          (/b/i.test(inputs.message.html[i].style) ? '<b>' : '') +
          (/i/i.test(inputs.message.html[i].style) ? '<i>' : '') +
          (/url/i.test(inputs.message.html[i].style) ? `<a href="${inputs.message.html[i].url}">` : '') +
          t(inputs.client.lang, inputs.message.html[i].text) +
          (/i/i.test(inputs.message.html[i].style) ? '</i>' : '') +
          (/b/i.test(inputs.message.html[i].style) ? '</b>' : '') +
          (/url/i.test(inputs.message.html[i].style) ? '</a>' : '') +
          (inputs.message.html.length > 1
            ? (inputs.message.html[i].cr
              ? sails.config.custom[inputs.message.html[i].cr]
              : '')
            : '');
      }

      resultHtml = await sails.helpers.messageProcessor.parseSpecialTokens.with({
        client: inputs.client,
        message: inputs.message,
      });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: resultHtml,
      })

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

