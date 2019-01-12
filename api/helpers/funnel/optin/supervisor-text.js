module.exports = {


  friendlyName: 'supervisorText optin funnel helper',


  description: 'Supervisor helper to manage all communication ' +
    'for optin funnel',


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

    /**
     * Check if the message received is a reply to a forced message
     */

    if (!_.isNil(inputs.msg.reply_to_message)
      && !_.isNil(inputs.msg.reply_to_message.message_id)) {

      /**
       * Save the received forced message
       */

      try {

        await sails.helpers.storage.messageSave.with({
          message: inputs.msg.text,
          message_format: 'forced',
          messenger: inputs.client.messenger,
          message_originator: 'client',
          client_id: inputs.client.id
        })

      } catch (e) {

        sails.log.error('Message save error: ', e);

      }

      let forcedReplyBlock = _.find(inputs.client.funnels[inputs.client.current_funnel],
        {message_id: inputs.msg.reply_to_message.message_id});

      if (!_.isNil(forcedReplyBlock)) {

        let splitForcedHelperRes = _.split(forcedReplyBlock.forcedHelper, sails.config.custom.JUNCTION, 2);
        let forcedHelperBlock = splitForcedHelperRes[0];
        let forcedHelperName = splitForcedHelperRes[1];

        if (!_.isNil(sails.helpers.funnel[forcedHelperBlock][forcedHelperName])) {

          await sails.helpers.funnel[forcedHelperBlock][forcedHelperName](inputs.client, forcedReplyBlock, inputs.msg);

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

          return exits.success({
            status: 'nok',
            message: 'The helper with forcedHelperBlock=' +
              forcedHelperBlock + ' and forcedHelperName=' + forcedHelperName +
              ' was not found',
            payload: {
              client: inputs.client,
              block: forcedReplyBlock,
            }
          });

        }

      }

    }

    /**
     * Proceed the generic text message
     */

    /**
     * Save the received simple message
     */

    try {

      await sails.helpers.storage.messageSave.with({
        message: inputs.msg.text,
        message_format: 'simple',
        messenger: inputs.client.messenger,
        message_originator: 'client',
        client_id: inputs.client.id
      })

    } catch (e) {

      sails.log.error('Message save error: ', e);

    }


    let initialBlock = _.find(inputs.client.funnels[inputs.client.current_funnel],
      {previous: null});

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

      try {

        await sails.helpers.storage.clientUpdate.with({
          criteria: {guid: inputs.client.guid},
          data: {funnels: inputs.client.funnels}
        })

      } catch (e) {

        sails.log.error('Client record update error: ', e);

      }

    } else {

      sails.log.error('Initial block was not found of its ID is not defined: \nclient: ',
        inputs.client);

      return exits.success({
        status: 'nok',
        message: 'Initial block was not found of its ID is not defined',
        payload: {client: inputs.client}
      });

    }



  }


};

