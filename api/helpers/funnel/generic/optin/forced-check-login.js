module.exports = {


  friendlyName: 'optin::forcedCheckLogin',


  description: 'optin::forcedCheckLogin',


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
    msg: {
      friendlyName: 'message',
      description: 'Message received',
      type: 'ref',
      // required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs,exits) {

    const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});
    const currentAccountInd = _.findIndex(inputs.client.accounts, (o) => {
      return o.guid === currentAccount.guid;
    });

    try {

      sails.log.info('/*************** optin::forcedCheckLogin ***************/');


      if (_.trim(inputs.msg.text) === '') {

        /**
         * No Instagram profile entered
         */

        inputs.block.done = true;
        inputs.block.next = 'optin::wrong_profile';

      } else {

        /**
         * Got Instagram profile
         */

        inputs.client.accounts[currentAccountInd].inst_profile = _.trim(inputs.msg.text);
        inputs.client.accounts[currentAccountInd].profile_provided = true;

        inputs.block.done = true;
        inputs.block.next = 'optin::confirm_profile';

      }

      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.msg,
        next: true,
        previous: true,
        switchFunnel: true,
      });



    } catch (e) {

      const errorLocation = 'api/helpers/funnel/optin/forced-check-login';
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

