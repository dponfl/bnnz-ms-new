module.exports = {


  friendlyName: 'help::callbackConfirmProfile',


  description: 'help::callbackConfirmProfile',


  inputs: {
    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    block: {
      friendlyName: 'block',
      description: 'Current funnel block',
      type: 'ref',
      required: true,
    },
    query: {
      friendlyName: 'query',
      description: 'Callback query received',
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

    let serviceName = 'generic';

    const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});
    const currentAccountInd = _.findIndex(inputs.client.accounts, (o) => {
      return o.guid === currentAccount.guid;
    });

    try {

      sails.log.info('/*************** help::callbackConfirmProfile ***************/');

      // sails.log.debug('Client: ', inputs.client);
      // sails.log.debug('Block: ', inputs.block);
      // sails.log.debug('Query: ', inputs.query);


      switch (inputs.query.data) {
        case 'new_profile_confirm_yes':

          /**
           * Get info about the respective service
           */

          const getServiceRes = await sails.helpers.storage.getService.with({serviceName: serviceName});

          /**
           * Create new account and link it to this client
           */

          const accountRaw = await sails.helpers.storage.accountCreate.with({
            account: {
              client: inputs.client.id,
              inst_profile: inputs.client.inst_profile_tmp,
              profile_provided: true,
              profile_confirmed: true,
              service: getServiceRes.payload.id,
            }
          });

          if (_.isNil(accountRaw.payload.guid)) {

            throw new Error(`ERROR: accountRaw.payload.guid does not defined, accountRaw: ${accountRaw}`);

          }

          inputs.client.account_tmp = accountRaw.payload.guid;
          inputs.client.inst_profile_tmp = null;
          inputs.block.next = 'help::we_have_several_service_levels';

          break;

        case 'new_profile_confirm_no':

          inputs.client.inst_profile_tmp = null;
          inputs.block.next = 'help::try_again';

          break;

        default:
          throw new Error(`Wrong callback data: ${inputs.query.data}`);
      }

      inputs.block.done = true;

      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.query,
        next: true,
        previous: true,
        switchFunnel: true,
      });


    } catch (e) {

      const errorLocation = 'api/helpers/funnel/help/callback-confirm-profile';
      const errorMsg = 'Error';

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }


    return exits.success({
      status: 'ok',
      message: 'Success',
      payload: {}
    });
  }


};

