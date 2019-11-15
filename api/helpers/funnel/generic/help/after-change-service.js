"use strict";

module.exports = {


  friendlyName: 'help::afterChangeService',


  description: 'help::afterChangeService',


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

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    const newAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_tmp});
    const newAccountInd = _.findIndex(inputs.client.accounts, (o) => {
      return o.guid === newAccount.guid;
    });


    try {

      sails.log.info('/*************** help::afterChangeService ***************/');

      /**
       * Turn client.payment_plan to null
       */

      inputs.client.accounts[newAccountInd].payment_plan = null;
      inputs.client.accounts[newAccountInd].payment_plan_selected = false;

      /**
       * Update help::select_service_level block
       */

      updateBlock = 'help::select_service_level';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.shown = false;
        getBlock.done = false;
        getBlock.enabled = false;
        getBlock.next = null;
      }

      /**
       * Update help::selected_platinum block
       */

      updateBlock = 'help::selected_platinum';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.shown = false;
        getBlock.done = false;
        getBlock.enabled = false;
        getBlock.next = null;
      }

      /**
       * Update help::selected_gold block
       */

      updateBlock = 'help::selected_gold';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.shown = false;
        getBlock.done = false;
        getBlock.enabled = false;
        getBlock.next = null;
      }

      /**
       * Update help::selected_bronze block
       */

      updateBlock = 'help::selected_bronze';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.shown = false;
        getBlock.done = false;
        getBlock.enabled = false;
        getBlock.next = null;
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

      sails.log.error('api/helpers/funnel/help/after-change-service, error: ', e);

      throw {err: {
          module: 'api/helpers/funnel/help/after-change-service',
          message: 'api/helpers/funnel/help/after-change-service error',
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

