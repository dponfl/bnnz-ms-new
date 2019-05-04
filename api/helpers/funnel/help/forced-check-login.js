module.exports = {


  friendlyName: 'help::forcedCheckLogin',


  description: 'help::forcedCheckLogin',


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
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs,exits) {

    let enteredProfile = _.trim(inputs.msg.text);

    const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});
    const currentAccountInd = _.findIndex(inputs.client.accounts, (o) => {
      return o.guid === currentAccount.guid;
    });

    try {

      sails.log.debug('/*************** help::forcedCheckLogin ***************/');


      if (enteredProfile === '') {

        /**
         * No Instagram profile entered
         */

        inputs.block.done = true;
        inputs.block.next = 'help::wrong_profile';

      } else {

        /**
         * Got Instagram profile
         */

        /**
         * Check that there is no such Instagram profile among the existing accounts
         */

        let enteredAccountExists = false;

        _.forEach(inputs.client.accounts, (acc) => {

          if (acc.inst_profile === enteredProfile) {
            enteredAccountExists = true;
          }

        });

        if (enteredAccountExists) {

          inputs.block.done = true;
          inputs.block.next = 'help::profile_exists';

        } else {

          inputs.block.done = true;
          inputs.block.next = 'help::confirm_profile';
          inputs.client.inst_profile_tmp = enteredProfile;

        }

        // await sails.helpers.storage.clientUpdate.with({
        //   criteria: {guid: inputs.client.guid},
        //   data: inputs.client
        // });

        inputs.block.done = true;
        inputs.block.next = 'help::confirm_profile';

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

      throw {err: {
          module: 'api/helpers/funnel/help/forced-check-login',
          message: 'api/helpers/funnel/help/forced-check-login error',
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
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

