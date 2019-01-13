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

    /**
     * Save the received callback query message
     */

    try {

      await sails.helpers.storage.messageSave.with({
        message: inputs.query.data,
        message_format: 'callback',
        messenger: inputs.client.messenger,
        message_originator: 'client',
        client_id: inputs.client.id,
        client_guid: inputs.client.guid
      })

    } catch (e) {

      sails.log.error('Message save error: ', e);

    }

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

          try {

            await sails.helpers.funnel[callbackHelperBlock][callbackHelperName](inputs.client, block, inputs.query);

          } catch (e) {

            sails.log.error('Respective callback helper does not exist:\nError: ', e);

            try {

              await sails.helpers.general.logError.with({
                client_guid: inputs.client.guid,
                error_message: 'Respective callback helper does not exist',
                level: 'critical',
                payload: e
              });

            } catch (e) {

              sails.log.error('Error log create error: ', e);

            }

          }


          /**
           * Update content of funnels field of client record
           */

          try {

            await sails.helpers.storage.clientUpdate.with({
              criteria: {guid: inputs.client.guid},
              data: {funnels: inputs.client.funnels}
            })

          } catch (e) {

            sails.log.error('Client record update error: ', e);

          }

        } else {

          sails.log.error('The helper with callbackHelperBlock=' +
            callbackHelperBlock + ' or callbackHelperName=' + callbackHelperName +
            ' not defined');

          try {

            await sails.helpers.general.logError.with({
              client_guid: inputs.client.guid,
              error_message: 'Respective callbacks not defined',
              level: 'critical',
              payload: 'The helper with callbackHelperBlock=' +
                callbackHelperBlock + ' or callbackHelperName=' + callbackHelperName +
                ' not defined'
            });

          } catch (e) {

            sails.log.error('Error log create error: ', e);

          }

          return exits.success({
            status: 'nok',
            message: 'The helper with callbackHelperBlock=' +
              callbackHelperBlock + ' and callbackHelperName=' + callbackHelperName +
              ' was not found',
            payload: {
              client: inputs.client,
              block: block,
            }
          });

        }


      }

    }

  }


};

