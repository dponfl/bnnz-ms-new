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
      // required: true,
    },
    next: {
      friendlyName: 'activateNext',
      description: 'flag if we allow to activate the next funnel block',
      type: 'boolean',
      required: true,
    },
    previous: {
      friendlyName: 'markPrevious',
      description: 'flag if we allow to mark the previous funnel block as done',
      type: 'boolean',
      required: true,
    },
    switchFunnel: {
      friendlyName: 'switchToFunnel',
      description: 'flag if we allow to switch to the different funnel specified by switchToFunnel',
      type: 'boolean',
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

    /**
     * Perform general activities after the block was performed, like:
     * 1) if next block is specified -> we need to enable it
     * 2) if previous block is specified -> we need to mark it as done
     * 3) if switchToFunnel not null -> we need switch to the specific funnel
     */

    try {

      // inputs.block.done = true;

      if (inputs.next && inputs.block.next) {

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

      if (inputs.previous && inputs.block.previous) {

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

      if (inputs.switchFunnel && inputs.block.switchToFunnel) {

        /**
         * We need to switch client to the specified funnel
         */

        inputs.client.current_funnel = inputs.block.switchToFunnel;

        // await sails.helpers.storage.clientUpdate.with({
        //   criteria: {guid: inputs.client.guid},
        //   data: {current_funnel: inputs.block.switchToFunnel}
        // });

      }

      await sails.helpers.storage.clientUpdate.with({
        criteria: {guid: inputs.client.guid},
        // data: {funnels: inputs.client.funnels}
        data: inputs.client
      });


      return exits.success();

    } catch (e) {

      sails.log.error('api/helpers/funnel/after-helper-generic, error: ', e);

      throw {err: {
          module: 'api/helpers/funnel/after-helper-generic',
          message: sails.config.custom.AFTERHELPERGENERIC_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }


  }


};

