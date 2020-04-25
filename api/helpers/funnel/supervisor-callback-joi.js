"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:supervisor-callback-joi';


module.exports = {


  friendlyName: 'Supervisor callback query helper',


  description: 'Supervisor callback query helper',


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
      client: Joi
        .any()
        .description('Client record')
        .required(),
      query: Joi
        .any()
        .description('Query received')
        .required(),
      additionalTokens: Joi
        .any(),
    });

    let input;


    try {

      input = await schema.validateAsync(inputs.params);

      /**
       * Save the received callback query message
       */

      await sails.helpers.storage.messageSaveJoi({
        message_id: input.query.message.message_id || 0,
        callback_query_id: input.query.id || 0,
        message: input.query.data,
        message_format: sails.config.custom.enums.messageFormat.CALLBACK,
        messenger: input.client.messenger,
        message_originator: sails.config.custom.enums.messageOriginator.CLIENT,
        client_id: input.client.id,
        client_guid: input.client.guid
      });

      /**
       * Get message_id from the callback query
       */

      if (!_.isNil(input.query.message.message_id)) {

        /**
         * Find block and get callback helper
         */

        let block = _.find(input.client.funnels[input.client.current_funnel],
          {message_id: input.query.message.message_id});

        if (!_.isNil(block)) {

          /**
           * We need to perform callbackHelper
           */

          let splitCallbackHelperRes = _.split(block.callbackHelper, sails.config.custom.JUNCTION, 2);
          let callbackHelperBlock = splitCallbackHelperRes[0];
          let callbackHelperName = splitCallbackHelperRes[1];

          if (callbackHelperBlock && callbackHelperName) {

            /**
             * We managed to parse the specified callbackHelper and can perform it
             */

            await sails.helpers.funnel[input.client.funnel_name][callbackHelperBlock][callbackHelperName]({
              client: input.client,
              block,
              query: input.query,
            });

            /**
             * We need to start processing funnel again because if callback enabled some new
             * block it should be shown
             */

            /**
             * Try to find the initial block of the current funnel
             */

            let initialBlock = _.find(input.client.funnels[input.client.current_funnel],
              {initial: true});

            /**
             * Check that the initial block was found
             */

            if (!_.isNil(initialBlock) && !_.isNil(initialBlock.id)) {

              await sails.helpers.funnel.proceedNextBlockJoi({
                client: input.client,
                funnelName: input.client.current_funnel,
                blockId: initialBlock.id,
                additionalTokens: input.additionalTokens,
                msg: input.query.message,
              });

            } else {

              /**
               * Throw error -> initial block was not found
               */

              throw new Error(`${moduleName}, error: ${sails.config.custom.SUPERVISOR_CALLBACK_HELPER_INITIAL_BLOCK_FIND_ERROR}`);
            }

            /**
             * Update content of funnels field of client record
             */

            await sails.helpers.storage.clientUpdateJoi({
              criteria: {guid: input.client.guid},
              data: {funnels: input.client.funnels}
            });

          } else {
            /**
             * Throw error: we could not parse the specified callbackHelper
             */

            throw new Error(`${moduleName}, error: ${sails.config.custom.SUPERVISOR_CALLBACK_HELPER_PARSE_ERROR}`);
          }

        } else {
          throw new Error(`${moduleName}, error: ${sails.config.custom.SUPERVISOR_CALLBACK_HELPER_BLOCK_FIND_ERROR}`);
        }

      }

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: ${sails.config.custom.SUPERVISOR_CALLBACK_HELPER_ERROR}`;

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

