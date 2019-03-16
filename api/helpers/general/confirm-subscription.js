module.exports = {


  friendlyName: 'confirmSubscription',


  description: 'confirmSubscription',


  inputs: {
    cid: {
      friendlyName: 'client guid',
      description: 'client guid',
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
    sails.log.debug('************** confirmSubscription helper **************');

    let client;
    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

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
          message: sails.config.custom.CONFIRM_SUBSCRIPTION_CLIENT_NOT_FOUND,
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
         * Update optin::wait_subscription_check block
         */

        updateBlock = 'optin::wait_subscription_check';

        splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
        updateFunnel = splitRes[0];
        updateId = splitRes[1];


        getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

        if (getBlock) {
          getBlock.done = true;
          getBlock.next = 'optin::subscription_check_done';
        }


        /**
         * Update optin::subscription_check_done block
         */

        updateBlock = 'optin::subscription_check_done';

        splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
        updateFunnel = splitRes[0];
        updateId = splitRes[1];


        getBlock = _.find(client.funnels[updateFunnel], {id: updateId});

        if (getBlock) {
          getBlock.enabled = true;
        }

        /**
         * Try to find the initial block of the current funnel
         */

        let initialBlock = _.find(client.funnels[client.current_funnel],
          {initial: true});

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
          message: sails.config.custom.CONFIRM_SUBSCRIPTION_SUCCESS,
          payload: {
            client_guid: client.guid,
          }
        });

      }

    } catch (e) {

      sails.log.error('api/helpers/general/confirm-subscription error, input: ', inputs);
      sails.log.error('api/helpers/general/confirm-subscription error, error: ', e);

      throw {err: {
          module: 'api/helpers/general/confirm-subscription',
          message: sails.config.custom.CONFIRM_SUBSCRIPTION_GENERAL_ERROR,
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

