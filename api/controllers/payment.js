module.exports = {


  friendlyName: 'Payment',


  description: 'Payment something.',


  inputs: {

    cid: {
      friendlyName: 'client guid',
      description: 'client guid',
      type: 'string',
      required: true,
    },

  },


  exits: {

  },


  fn: async function (inputs, exits) {

    sails.log.warn('<<<<<<<<<<<<<<   payment api   >>>>>>>>>>>>>');
    sails.log.warn('Params: ', inputs);

    let client;

    try {

      client = await Client.findOne({
        guid: inputs.cid,
      })
      // .populate('messages')
        .populate('rooms')
        .populate('service');

      if (!client) {

        /**
         * Reply that the client was not found
         */

        sails.log('client was NOT FOUND');

        return exits.success({
          status: 'not_found',
          message: sails.config.custom.CLIENT_NOT_FOUND,
          payload: {
            cid: inputs.cid,
          },
        });

      } else {

        /**
         * found record for the specified criteria
         */

        sails.log('client was FOUND');

        /**
         * Try to find the initial block of the current funnel
         */

        let initialBlock = _.find(client.funnels[client.current_funnel],
          {initial: true});

        // sails.log.debug('initialBlock: ', initialBlock);

        /**
         * Check that the initial block was found
         */

        if (!_.isNil(initialBlock) && !_.isNil(initialBlock.id)) {

          await sails.helpers.funnel.proceedNextBlock.with({
            client: client,
            funnelName: client.current_funnel,
            blockId: initialBlock.id,
          });

        }

        return exits.success({
          status: 'found',
          message: sails.config.custom.CLIENT_FOUND,
          // payload: client
        });

      }

    } catch (e) {

      sails.log.error('api/controllers/payment error, input: ', inputs);

      throw {err: {
          module: 'api/controllers/payment',
          message: sails.config.custom.CLIENT_GENERAL_ERROR,
          payload: {
            error: e.message || 'no error message',
          },
        }
      };

    }

  }


};
