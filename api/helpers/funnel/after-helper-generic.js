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

    let splitRes = _.split(inputs.block.next, sails.config.custom.JUNCTION, 2);
    let nextFunnel = splitRes[0];
    let nextId = splitRes[1];

    if (
      nextFunnel
      && nextId
    ) {

      let nextBlock = _.find(inputs.client.funnels[nextFunnel], {id: nextId});
      nextBlock.enabled = true;

    }

    return exits.success();
  }


};

