module.exports = {


  friendlyName: 'After helper generic',


  description: 'Generic afterHelper',


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

    err: {
      description: 'Error',
    }

  },


  fn: async function (inputs, exits) {

    try {

      inputs.block.done = true;

      let splitRes = _.split(inputs.block.next, sails.config.custom.JUNCTION, 2);
      let nextFunnel = splitRes[0];
      let nextId = splitRes[1];

      if (
        nextFunnel
        && nextId
      ) {

        let nextBlock = _.find(inputs.client.funnels[nextFunnel], {id: nextId});
        inputs.block.enabled = 'ABC';
        nextBlock.enabled = 'DEF';

      }

    } catch (e) {
      sails.log.error(e);

      return exits.success({
        status: 'nok',
        message: 'Error',
        payload: e
      });
    }


    return exits.success({
      status: 'ok',
      message: 'Success',
      payload: {}
    });
  }


};

