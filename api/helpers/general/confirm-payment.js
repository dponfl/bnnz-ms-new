module.exports = {


  friendlyName: 'confirmPayment',


  description: 'confirmPayment',


  inputs: {
    cid: {
      friendlyName: 'client guid',
      description: 'client guid',
      type: 'string',
      required: true,
    },
    sl: {
      friendlyName: 'service level',
      description: 'service level',
      type: 'string',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {
    sails.log.debug('confirmPayment helper...');

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
          message: sails.config.custom.CONFIRM_PAYMENT_CLIENT_NOT_FOUND,
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
         * Check received service level corresponds to the one selected by the client
         */

        if (inputs.sl !== client.payment_plan) {

          return exits.success({
            status: 'wrong_sl',
            message: sails.config.custom.CONFIRM_PAYMENT_WRONG_SL,
            payload: {
              cid: inputs.cid,
              sl: inputs.sl,
            },
          });

        }

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
          status: 'success',
          message: sails.config.custom.CONFIRM_PAYMENT_SUCCESS,
          // payload: client
        });

      }

    } catch (e) {

      sails.log.error('api/helpers/general/confirm-payment error, input: ', inputs);
      sails.log.error('api/helpers/general/confirm-payment error, error: ', e);

      throw {err: {
          module: 'api/helpers/general/confirm-payment',
          message: sails.config.custom.CONFIRM_PAYMENT_GENERAL_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          },
        }
      };

    }


  }

};

