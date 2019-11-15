"use strict";

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

      sails.log.info('/*************** help::forcedCheckLogin ***************/');

      // sails.log.debug(`inputs.msg.text: ${inputs.msg.text}`);
      // sails.log.debug(`enteredProfile: ${enteredProfile}`);
      // sails.log.debug(`currentAccount: ${currentAccount}`);
      // sails.log.debug(`currentAccountInd: ${currentAccountInd}`);


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

          // sails.log.warn(`acc: `, acc);

          if (_.trim(acc.inst_profile.toLowerCase()) === _.trim(enteredProfile.toLowerCase())) {
            enteredAccountExists = true;
          }

        });

        // sails.log.warn(`enteredAccountExists: `, enteredAccountExists);

        if (enteredAccountExists) {

          // sails.log.warn('We got Instagram profile like already exists');

          inputs.block.done = true;
          inputs.block.next = 'help::profile_exists';

        } else {

          // sails.log.warn('We got new Instagram profile');

          inputs.block.done = true;
          inputs.block.next = 'help::confirm_profile';
          inputs.client.inst_profile_tmp = enteredProfile;

        }

        // await sails.helpers.storage.clientUpdate.with({
        //   criteria: {guid: inputs.client.guid},
        //   data: inputs.client
        // });

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

      const errorLocation = 'api/helpers/funnel/help/forced-check-login';
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

