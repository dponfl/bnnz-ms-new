module.exports = {


  friendlyName: 'optin::checkLogin',


  description: 'optin::checkLogin',


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

      sails.log.debug('/*************** optin::checkLogin ***************/');


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
          module: 'api/helpers/funnel/optin/check-login',
          message: 'api/helpers/funnel/optin/check-login error',
          payload: {
            client: inputs.client,
            block: inputs.block,
            msg: inputs.msg,
            error: e.message || 'no error message',
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

