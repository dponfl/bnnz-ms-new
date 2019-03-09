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

    let moveTo;
    let splitRes;
    let nextFunnel;
    let nextId;

    try {

      sails.log.debug('/*************** optin::wrongProfileResponse ***************/');

      /**
       * Initiate optin::get_login block
       */

      moveTo = 'optin::get_login';

      splitRes = _.split(moveTo, sails.config.custom.JUNCTION, 2);
      nextFunnel = splitRes[0];
      nextId = splitRes[1];


      getLoginBlock = _.find(inputs.client.funnels[nextFunnel], {id: nextId});

      if (getLoginBlock) {
        getLoginBlock.shown = false;
        getLoginBlock.done = false;
        getLoginBlock.next = null;
      }

      /**
       * Initiate optin::confirm_profile block
       */

      moveTo = 'optin::confirm_profile';

      splitRes = _.split(moveTo, sails.config.custom.JUNCTION, 2);
      nextFunnel = splitRes[0];
      nextId = splitRes[1];


      getLoginBlock = _.find(inputs.client.funnels[nextFunnel], {id: nextId});

      if (getLoginBlock) {
        getLoginBlock.enabled = false;
        getLoginBlock.shown = false;
        getLoginBlock.done = false;
        getLoginBlock.next = null;
      }

      /**
       * Initiate optin::wrong_profile block
       */

      moveTo = 'optin::wrong_profile';

      splitRes = _.split(moveTo, sails.config.custom.JUNCTION, 2);
      nextFunnel = splitRes[0];
      nextId = splitRes[1];


      getLoginBlock = _.find(inputs.client.funnels[nextFunnel], {id: nextId});

      if (getLoginBlock) {
        getLoginBlock.enabled = false;
        getLoginBlock.shown = false;
        getLoginBlock.done = false;
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

