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

    // inputs.block.done = true;

    if (inputs.block.next) {

      let splitRes = _.split(inputs.block.next, sails.config.custom.JUNCTION, 2);
      let nextFunnel = splitRes[0];
      let nextId = splitRes[1];

      if (
        nextFunnel
        && nextId
      ) {

        let nextBlock = _.find(inputs.client.funnels[nextFunnel], {id: nextId});
        if (nextBlock) {
          nextBlock.enabled = true;
        }

      }

    }

    if (inputs.block.previous) {

      let splitRes = _.split(inputs.block.previous, sails.config.custom.JUNCTION, 2);
      let previousFunnel = splitRes[0];
      let previousId = splitRes[1];

      if (
        previousFunnel
        && previousId
      ) {

        let previousBlock = _.find(inputs.client.funnels[previousFunnel], {id: previousId});
        if (previousBlock) {
          previousBlock.done = true;
        }

      }


    }

    // TODO: Update client's record in DB before exit

    return exits.success();
  }


};

