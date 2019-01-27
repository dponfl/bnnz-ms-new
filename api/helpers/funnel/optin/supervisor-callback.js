module.exports = {


  friendlyName: 'Supervisor callback query helper for optin query',


  description: 'Supervisor callback query helper for optin query',


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

          let splitCallbackHelperRes = _.split(block.callbackHelper, sails.config.custom.JUNCTION, 2);
          let callbackHelperBlock = splitCallbackHelperRes[0];
          let callbackHelperName = splitCallbackHelperRes[1];

          if (callbackHelperBlock && callbackHelperName) {

            /**
             * We managed to parse the specified callbackHelper and can perform it
             */

            await sails.helpers.funnel[callbackHelperBlock][callbackHelperName](inputs.client, block, inputs.query);

            /**
             * Update content of funnels field of client record
             */

            await sails.helpers.storage.clientUpdate.with({
              criteria: {guid: inputs.client.guid},
              data: {funnels: inputs.client.funnels}
            });

          } else {

            /**
             * Throw error: we could not parse the specified callbackHelper
             */

            throw {err: {
                module: 'api/helpers/funnel/optin/supervisor-callback',
                message: sails.config.custom.SUPERVISOR_CALLBACK_HELPER_PARSE_ERROR,
                payload: {
                  block: block,
                  helperName: block.callbackHelper,
                  callbackHelperBlock: callbackHelperBlock,
                  callbackHelperName: callbackHelperName,
                  query: inputs.query,
                }
              }
            };

          }

        } else {

          throw {err: {
              module: 'api/helpers/funnel/optin/supervisor-callback',
              message: sails.config.custom.SUPERVISOR_CALLBACK_HELPER_BLOCK_FIND_ERROR,
              payload: {
                client: inputs.client,
                message_id: inputs.query.message.message_id,
                query: inputs.query,
              }
            }
          };

        }

      }

    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/optin/supervisor-callback',
          message: sails.config.custom.SUPERVISOR_CALLBACK_HELPER_ERROR,
          payload: {
            client: inputs.client,
            query: inputs.query,
            error: e,
          }
        }
      };

    }

  }


};

