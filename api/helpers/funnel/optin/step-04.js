module.exports = {


  friendlyName: 'Step 04 helper',


  description: 'Step 04 helper',


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

      sails.log.debug('/*************** Step 04 helper ***************/');

      // let splitRes = _.split(inputs.block.next, sails.config.custom.JUNCTION, 2);
      // let nextFunnel = splitRes[0];
      // let nextId = splitRes[1];
      //
      // if (
      //   nextFunnel
      //   && nextId
      // ) {
      //
      //   let nextBlock = _.find(inputs.client.funnels[nextFunnel], {id: nextId});
      //   inputs.block.enabled = 'ABC';
      //   nextBlock.enabled = 'DEF';
      //
      // }

      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.msg,
        next: true,
        previous: true,
        switchFunnel: true,
      });


    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/optin/step-04',
          message: 'api/helpers/funnel/optin/step-04 error',
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

