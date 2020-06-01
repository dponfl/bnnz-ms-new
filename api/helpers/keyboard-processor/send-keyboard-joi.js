"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboard-processor:send-keyboard-joi';


module.exports = {


  friendlyName: 'keyboard-processor:send-keyboard-joi',


  description: 'keyboard-processor:send-keyboard-joi',


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

    const schema = Joi
      .object({
        client: Joi
          .any()
          .required(),
        keyboardData: Joi
          .any()
          .required(),
        additionalTokens: Joi
          .any(),
        additionalParams: Joi
          .any(),
        blockModifyHelperParams: Joi
          .any(),
        beforeHelperParams: Joi
          .any(),
        afterHelperParams: Joi
          .any(),
        disableWebPagePreview: Joi
          .boolean()
          .description('flag to disable web page preview at message'),
      });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      throw new Error(`${moduleName}, error: xxxxxxxxx: \n${JSON.stringify(input.client, null, 3)}`);

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const errorMsg = 'General error';

      sails.log.error(`${moduleName}, Error details:
      Platform error message: ${errorMsg}
      Error name: ${e.name || 'no name'}
      Error message: ${e.message || 'no message'}
      Error stack: ${JSON.stringify(e.stack || {}, null, 3)}`);

      throw {err: {
          module: `${moduleName}`,
          message: errorMsg,
          payload: {
            error_name: e.name || 'no name',
            error_message: e.message || 'no message',
            error_stack: e.stack || {},
          },
        }
      };

    }

  }

};

