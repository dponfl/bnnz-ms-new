module.exports = {


  friendlyName: 'Supervisor callback query helper for start query',


  description: 'Supervisor callback query helper for start query',


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
     * Get message_id from the callback query
     */

    if (!_.isNil(inputs.query.message.message_id)) {

      /**
       * Find block and get callback helper
       */

      let block = _.find(inputs.client.funnels[inputs.client.funnels.current],
        {message_id: inputs.query.message.message_id});

      if (!_.isNil(block)) {

        let splitCallbackHelperRes = _.split(block.callbackHelper, sails.config.custom.JUNCTION, 2);
        let callbackHelperBlock = splitCallbackHelperRes[0];
        let callbackHelperName = splitCallbackHelperRes[1];

        if (!_.isNil(sails.helpers.funnel[callbackHelperBlock][callbackHelperName])) {

          await sails.helpers.funnel[callbackHelperBlock][callbackHelperName](inputs.client, block, inputs.query);

        } else {

          sails.log.error('The helper with callbackHelperBlock=' +
            callbackHelperBlock + ' and callbackHelperName=' + callbackHelperName +
            ' was not found');

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

