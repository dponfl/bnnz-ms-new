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
    }
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

    if (
      inputs.block.nextFunnel
      && inputs.block.nextId
    ) {

      let nextBlock = _.find(inputs.client.funnels[inputs.block.nextFunnel], {id: inputs.block.nextId});
      nextBlock.enabled = 'ABC';

    }

    return exits.success();
  }


};

