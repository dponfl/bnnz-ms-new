module.exports = {


  friendlyName: 'optin::wrongProfileResponse',


  description: 'optin::wrongProfileResponse',


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
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs,exits) {

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      sails.log.debug('/*************** optin::wrongProfileResponse ***************/');

      /**
       * Update optin::get_login block
       */

      updateBlock = 'optin::get_login';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.shown = false;
        getBlock.done = false;
        getBlock.next = null;
      }

      /**
       * Update optin::confirm_profile block
       */

      updateBlock = 'optin::confirm_profile';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.enabled = false;
        getBlock.shown = false;
        getBlock.done = false;
        getBlock.next = null;
      }

      /**
       * Update optin::wrong_profile block
       */

      updateBlock = 'optin::wrong_profile';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.enabled = false;
        getBlock.shown = false;
        getBlock.done = false;
      }

      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.msg,
        next: true,
        previous: false,  // if we do not set it to false then previous block is set done=true
                          // and we will not be able to move to it again (but we want to move there
        switchFunnel: true,
      });


    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/optin/wrong-profile-response',
          message: 'api/helpers/funnel/optin/wrong-profile-response error',
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

