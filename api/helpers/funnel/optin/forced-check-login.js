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
    try {

      sails.log.debug('/*************** optin::forcedCheckLogin ***************/');


      if (_.trim(inputs.msg.text) === '') {

        /**
         * No Instagram profile entered
         */

        inputs.block.done = true;

        inputs.block.next = 'optin::wrong_profile';
        await sails.helpers.funnel.afterHelperGeneric.with({
          client: inputs.client,
          block: inputs.block,
          msg: inputs.msg,
          next: true,
          previous: true,
          switchFunnel: true,
        });

      } else {

        /**
         * Got Instagram profile
         */

        inputs.client.inst_profile = _.trim(inputs.msg.text);
        inputs.client.profile_provided = true;

        await sails.helpers.storage.clientUpdate.with({
          criteria: {guid: inputs.client.guid},
          data: {inst_profile: inputs.client.inst_profile}
        });

        inputs.block.done = true;

        inputs.block.next = 'optin::confirm_profile';
        await sails.helpers.funnel.afterHelperGeneric.with({
          client: inputs.client,
          block: inputs.block,
          msg: inputs.msg,
          next: true,
          previous: true,
          switchFunnel: true,
        });

      }


    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/optin/forced-check-login',
          message: 'api/helpers/funnel/optin/forced-check-login error',
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
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
