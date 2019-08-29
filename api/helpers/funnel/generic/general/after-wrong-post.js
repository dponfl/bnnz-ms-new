module.exports = {

  friendlyName: 'general::afterWrongPost',

  description: 'general::afterWrongPost',

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

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      sails.log.info('/*************** general::afterWrongPost ***************/');

      /**
       * Update general::make_post
       */

      updateBlock = 'general::make_post';

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.shown = false;
        getBlock.done = false;
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

      sails.log.error('api/helpers/funnel/general/after-wrong-post, error: ', e);

      throw {err: {
          module: 'api/helpers/funnel/general/after-wrong-post',
          message: 'api/helpers/funnel/general/after-wrong-post error',
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

