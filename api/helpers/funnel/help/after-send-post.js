module.exports = {


  friendlyName: 'help::afterSendPost',


  description: 'help::afterSendPost',


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


    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      sails.log.info('/*************** help::afterSendPost ***************/');

      inputs.block.done = true;

      /**
       * Update block in 'next'
       */

      updateBlock = inputs.block.next;

      splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {

        getBlock.previous = 'help::send_post';

      } else {

        throw new Error(`Wrong block decoding for data: ${updateBlock}`);

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

      sails.log.error('api/helpers/funnel/help/after-send-post, error: ', e);

      throw {err: {
          module: 'api/helpers/funnel/help/after-send-post',
          message: 'api/helpers/funnel/help/after-send-post error',
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

