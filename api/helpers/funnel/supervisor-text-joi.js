"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:supervisor-text-joi';


module.exports = {


  friendlyName: 'supervisorText funnel helper',


  description: 'Supervisor helper to manage all communication ',


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
      additionalTokens: Joi
        .any(),
      msg: Joi
        .any()
        .description('Message received'),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      /**
       * Check if the message received is a reply to a forced message
       */

      if (!_.isNil(input.msg.reply_to_message)
        && !_.isNil(input.msg.reply_to_message.message_id)) {

        /**
         * Save the received forced message
         */

        await sails.helpers.storage.messageSaveJoi({
          message_id: input.msg.message_id || 0,
          message: input.msg.text,
          message_format: sails.config.custom.enums.messageFormat.FORCED,
          messenger: input.client.messenger,
          message_originator: sails.config.custom.enums.messageOriginator.CLIENT,
          client_id: input.client.id,
          client_guid: input.client.guid
        });

        let forcedReplyBlock = _.find(input.client.funnels[input.client.current_funnel],
          {message_id: input.msg.reply_to_message.message_id});

        if (!_.isNil(forcedReplyBlock)) {

          let splitForcedHelperRes = _.split(forcedReplyBlock.forcedHelper, sails.config.custom.JUNCTION, 2);
          let forcedHelperBlock = splitForcedHelperRes[0];
          let forcedHelperName = splitForcedHelperRes[1];

          if (forcedHelperBlock && forcedHelperName) {

            /**
             * We managed to parse the specified forcedHelper and can perform it
             */

            await sails.helpers.funnel[input.client.funnel_name][forcedHelperBlock][forcedHelperName]({
              client: input.client,
              block: forcedReplyBlock,
              msg: input.msg,
            });

            /**
             * Update content of funnels field of client record
             */

            await sails.helpers.storage.clientUpdateJoi({
              criteria: {guid: input.client.guid},
              data: {funnels: input.client.funnels},
              createdBy: moduleName,
            });

          } else {

            /**
             * Throw error: we could not parse the specified forcedHelper
             */

            throw new Error(`${moduleName}, error: ${sails.config.custom.SUPERVISORTEXTHELPER_FORCEDHELPER_PARSE_ERROR}`);
          }

        } else {

          throw new Error(`${moduleName}, error: ${sails.config.custom.SUPERVISORTEXTHELPER_FORCEDREPLY_BLOCK_FIND_ERROR}`);
        }

      } else {

        /**
         * Proceed the generic text message
         */

        /**
         * Save the received simple message
         */

        await sails.helpers.storage.messageSaveJoi({
          message_id: input.msg.message_id || 0,
          message: input.msg.text,
          message_format: sails.config.custom.enums.messageFormat.SIMPLE,
          messenger: input.client.messenger,
          message_originator: sails.config.custom.enums.messageOriginator.CLIENT,
          client_id: input.client.id,
          client_guid: input.client.guid
        });

      }

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
          msg: input.msg,
          createdBy: moduleName,
        });

        /**
         * Update content of funnels field of client record
         */

        await sails.helpers.storage.clientUpdateJoi({
          criteria: {guid: input.client.guid},
          data: {funnels: input.client.funnels},
          createdBy: moduleName,
        });

      } else {

        /**
         * Throw error -> initial block was not found
         */

        throw new Error(`${moduleName}, error: ${sails.config.custom.SUPERVISORTEXTHELPER_INITIAL_BLOCK_FIND_ERROR}`);
      }

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: ${sails.config.custom.SUPERVISORTEXTHELPER_ERROR}`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

      return await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
        throwError: false,
      });

    }

  }

};

