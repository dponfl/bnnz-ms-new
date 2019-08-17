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

            sails.log.error('api/helpers/funnel/after-helper-generic, error: ',
              sails.config.custom.SUPERVISORTEXTHELPER_FORCEDHELPER_PARSE_ERROR
            );


            throw {err: {
                module: 'api/helpers/funnel/supervisor-text',
                message: sails.config.custom.SUPERVISORTEXTHELPER_FORCEDHELPER_PARSE_ERROR,
                payload: {
                  block: forcedReplyBlock,
                  helperName: forcedReplyBlock.forcedHelper,
                  forcedHelperBlock: forcedHelperBlock,
                  forcedHelperName: forcedHelperName,
                }
              }
            };

          }

        } else {

          sails.log.error('api/helpers/funnel/supervisor-text',
            sails.config.custom.SUPERVISORTEXTHELPER_FORCEDREPLY_BLOCK_FIND_ERROR
            );

          throw {err: {
              module: 'api/helpers/funnel/supervisor-text',
              message: sails.config.custom.SUPERVISORTEXTHELPER_FORCEDREPLY_BLOCK_FIND_ERROR,
              payload: {},
            }
          };

        }

      } else {

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

      }

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

        sails.log.error('api/helpers/funnel/supervisor-text, error: ',
          sails.config.custom.SUPERVISORTEXTHELPER_INITIAL_BLOCK_FIND_ERROR
          );

        throw {err: {
            module: 'api/helpers/funnel/supervisor-text',
            message: sails.config.custom.SUPERVISORTEXTHELPER_INITIAL_BLOCK_FIND_ERROR,
            payload: {},
          }
        };

      }

    } catch (e) {

      const errorLocation = 'api/helpers/funnel/supervisor-text';
      const errorMsg = sails.config.custom.SUPERVISORTEXTHELPER_ERROR;

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

