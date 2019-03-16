module.exports = {


  friendlyName: 'Supervisor callback query helper',


  description: 'Supervisor callback query helper',


  inputs: {
    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    query: {
      friendlyName: 'query',
      description: 'Query received',
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

      sails.log.debug('/*************** supervisorCallback ***************/');

      // sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Query: ', inputs.query);


      /**
       * Save the received callback query message
       */

      await sails.helpers.storage.messageSave.with({
        message: inputs.query.data,
        message_format: 'callback',
        messenger: inputs.client.messenger,
        message_originator: 'client',
        client_id: inputs.client.id,
        client_guid: inputs.client.guid
      });

      /**
       * Get message_id from the callback query
       */

      if (!_.isNil(inputs.query.message.message_id)) {

        /**
         * Find block and get callback helper
         */

        let block = _.find(inputs.client.funnels[inputs.client.current_funnel],
          {message_id: inputs.query.message.message_id});

        if (!_.isNil(block)) {

          /**
           * First we need to perform afterHelper (if we have one)
           */

          // if (!_.isNil(block.afterHelper)) {
          //
          //   let splitAfterHelperRes = _.split(block.afterHelper, sails.config.custom.JUNCTION, 2);
          //   let afterHelperBlock = splitAfterHelperRes[0];
          //   let afterHelperName = splitAfterHelperRes[1];
          //
          //   if (afterHelperBlock && afterHelperName) {
          //
          //     /**
          //      * We managed to parse the specified afterHelper and can perform it
          //      */
          //
          //     let afterHelperParams = {
          //       client: inputs.client,
          //       block: block,
          //     };
          //
          //     if (inputs.query) {
          //
          //       afterHelperParams.msg = inputs.query;
          //
          //     }
          //
          //     await sails.helpers.funnel[afterHelperBlock][afterHelperName].with(afterHelperParams);
          //
          //
          //   } else {
          //
          //     /**
          //      * Throw error: we could not parse the specified afterHelper
          //      */
          //
          //     sails.log.error('Error: api/helpers/funnel/supervisor-callback, sails.config.custom.PROCEED_NEXT_BLOCK_AFTERHELPER_PARSE_ERROR: ');
          //
          //     throw {err: {
          //         module: 'api/helpers/funnel/supervisor-callback',
          //         message: sails.config.custom.PROCEED_NEXT_BLOCK_AFTERHELPER_PARSE_ERROR,
          //         payload: {
          //           params: inputs,
          //           helperName: block.afterHelper,
          //           afterHelperBlock: afterHelperBlock,
          //           afterHelperName: afterHelperName,
          //         }
          //       }
          //     };
          //
          //   }
          //
          // }

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

            await sails.helpers.funnel[callbackHelperBlock][callbackHelperName](inputs.client, block, inputs.query);

            /**
             * We need to start processing funnel again because if callback enabled some new
             * block it should be shown
             */

            /**
             * Try to find the initial block of the current funnel
             */

            let initialBlock = _.find(inputs.client.funnels[inputs.client.current_funnel],
              {initial: true});

            /**
             * Check that the initial block was found
             */

            if (!_.isNil(initialBlock) && !_.isNil(initialBlock.id)) {

              await sails.helpers.funnel.proceedNextBlock(
                inputs.client,
                inputs.client.current_funnel,
                initialBlock.id,
                inputs.query.message
              );

            } else {

              /**
               * Throw error -> initial block was not found
               */

              sails.log.error('Error: api/helpers/funnel/supervisor-callback, sails.config.custom.SUPERVISOR_CALLBACK_HELPER_INITIAL_BLOCK_FIND_ERROR');

              throw {err: {
                  module: 'api/helpers/funnel/supervisor-callback',
                  message: sails.config.custom.SUPERVISOR_CALLBACK_HELPER_INITIAL_BLOCK_FIND_ERROR,
                  payload: {
                    params: inputs,
                  }
                }
              };

            }


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
             * Throw error: we could not parse the specified callbackHelper
             */

            sails.log.error('Error: api/helpers/funnel/supervisor-callback, sails.config.custom.SUPERVISOR_CALLBACK_HELPER_PARSE_ERROR');

            throw {err: {
                module: 'api/helpers/funnel/supervisor-callback',
                message: sails.config.custom.SUPERVISOR_CALLBACK_HELPER_PARSE_ERROR,
                payload: {
                  params: inputs,
                  block: block,
                  helperName: block.callbackHelper,
                  callbackHelperBlock: callbackHelperBlock,
                  callbackHelperName: callbackHelperName,
                }
              }
            };

          }

        } else {

          sails.log.error('Error: api/helpers/funnel/supervisor-callback, sails.config.custom.SUPERVISOR_CALLBACK_HELPER_BLOCK_FIND_ERROR');

          throw {err: {
              module: 'api/helpers/funnel/supervisor-callback',
              message: sails.config.custom.SUPERVISOR_CALLBACK_HELPER_BLOCK_FIND_ERROR,
              payload: {
                params: inputs,
              }
            }
          };

        }

      }

    } catch (e) {

      sails.log.error('Error: api/helpers/funnel/supervisor-callback, sails.config.custom.SUPERVISOR_CALLBACK_HELPER_ERROR: ', e);

      throw {err: {
          module: 'api/helpers/funnel/supervisor-callback',
          message: sails.config.custom.SUPERVISOR_CALLBACK_HELPER_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

  }


};

