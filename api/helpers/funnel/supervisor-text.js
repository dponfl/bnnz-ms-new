module.exports = {


  friendlyName: 'supervisorText funnel helper',


  description: 'Supervisor helper to manage all communication ',


  inputs: {
    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    msg: {
      friendlyName: 'message',
      description: 'Message received',
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

      /**
       * Check if the message received is a reply to a forced message
       */

      if (!_.isNil(inputs.msg.reply_to_message)
        && !_.isNil(inputs.msg.reply_to_message.message_id)) {

        /**
         * Save the received forced message
         */

        await sails.helpers.storage.messageSave.with({
          message: inputs.msg.text,
          message_format: 'forced',
          messenger: inputs.client.messenger,
          message_originator: 'client',
          client_id: inputs.client.id,
          client_guid: inputs.client.guid
        });

        let forcedReplyBlock = _.find(inputs.client.funnels[inputs.client.current_funnel],
          {message_id: inputs.msg.reply_to_message.message_id});

        if (!_.isNil(forcedReplyBlock)) {

          let splitForcedHelperRes = _.split(forcedReplyBlock.forcedHelper, sails.config.custom.JUNCTION, 2);
          let forcedHelperBlock = splitForcedHelperRes[0];
          let forcedHelperName = splitForcedHelperRes[1];

          if (forcedHelperBlock && forcedHelperName) {

            /**
             * We managed to parse the specified forcedHelper and can perform it
             */

            await sails.helpers.funnel[forcedHelperBlock][forcedHelperName](inputs.client, forcedReplyBlock, inputs.msg);

            /**
             * Update content of funnels field of client record
             */

            await sails.helpers.storage.clientUpdate.with({
              criteria: {guid: inputs.client.guid},
              data: {funnels: inputs.client.funnels}
            });

            // await sails.helpers.storage.performedFunnelsSave.with({
            //   client_guid: inputs.client.guid,
            //   current_funnel: inputs.client.current_funnel,
            //   funnel_data: inputs.client.funnels,
            // });


          } else {

            /**
             * Throw error: we could not parse the specified forcedHelper
             */

            throw {err: {
                module: 'api/helpers/funnel/supervisor-text',
                message: sails.config.custom.SUPERVISORTEXTHELPER_FORCEDHELPER_PARSE_ERROR,
                payload: {
                  params: inputs,
                  block: forcedReplyBlock,
                  helperName: forcedReplyBlock.forcedHelper,
                  forcedHelperBlock: forcedHelperBlock,
                  forcedHelperName: forcedHelperName,
                }
              }
            };

          }

        } else {

          throw {err: {
              module: 'api/helpers/funnel/supervisor-text',
              message: sails.config.custom.SUPERVISORTEXTHELPER_FORCEDREPLY_BLOCK_FIND_ERROR,
              payload: {
                params: inputs,              }
            }
          };

        }

      }

      /**
       * Proceed the generic text message
       */

      /**
       * Save the received simple message
       */

      await sails.helpers.storage.messageSave.with({
        message: inputs.msg.text,
        message_format: 'simple',
        messenger: inputs.client.messenger,
        message_originator: 'client',
        client_id: inputs.client.id,
        client_guid: inputs.client.guid
      });

      /**
       * Try to find the initial block of the current funnel
       */

      let initialBlock = _.find(inputs.client.funnels[inputs.client.current_funnel],
        {initial: true});

      // sails.log.debug('initialBlock: ', initialBlock);

      /**
       * Check that the initial block was found
       */

      if (!_.isNil(initialBlock) && !_.isNil(initialBlock.id)) {

        await sails.helpers.funnel.proceedNextBlock(inputs.client,
          inputs.client.current_funnel,
          initialBlock.id, inputs.msg);

        /**
         * Update content of funnels field of client record
         */

        await sails.helpers.storage.clientUpdate.with({
          criteria: {guid: inputs.client.guid},
          data: {funnels: inputs.client.funnels}
        });

        // await sails.helpers.storage.performedFunnelsSave.with({
        //   client_guid: inputs.client.guid,
        //   current_funnel: inputs.client.current_funnel,
        //   funnel_data: inputs.client.funnels,
        // });


      } else {

        /**
         * Throw error -> initial block was not found
         */

        throw {err: {
            module: 'api/helpers/funnel/supervisor-text',
            message: sails.config.custom.SUPERVISORTEXTHELPER_INITIAL_BLOCK_FIND_ERROR,
            payload: {
              params: inputs,            }
          }
        };

      }

    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/supervisor-text',
          message: sails.config.custom.SUPERVISORTEXTHELPER_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }


  }


};

