"use strict";

module.exports = {


  friendlyName: 'optin::afterWrongProfile',


  description: 'optin::afterWrongProfile',


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


    err: {
      description: 'Error',
    }

  },


  fn: async function (inputs, exits) {

    let getLoginBlock;

    try {

      sails.log.info('/*************** optin::afterWrongProfile ***************/');

      let splitRes = _.split(inputs.block.previous, sails.config.custom.JUNCTION, 2);
      let nextFunnel = splitRes[0];
      let nextId = splitRes[1];


      getLoginBlock = _.find(inputs.client.funnels[nextFunnel], {id: nextId});

      if (getLoginBlock) {
        getLoginBlock.shown = false;
        getLoginBlock.done = false;
        getLoginBlock.next = null;

        /**
         * Update content of funnels field of client record
         */

        // await sails.helpers.storage.clientUpdate.with({
        //   criteria: {guid: inputs.client.guid},
        //   data: {funnels: inputs.client.funnels}
        // });

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

      const errorLocation = 'api/helpers/funnel/optin/after-wrong-profile';
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

