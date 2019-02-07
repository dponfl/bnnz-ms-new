module.exports = {


  friendlyName: 'Forced step 04',


  description: 'Helper for the forced message reply at Step 04',


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

  },


  fn: async function (inputs,exits) {
    try {

      sails.log.debug('/*************** Step 04 forced message helper ***************/');


      if (/111/i.test(inputs.msg.text)) {

        inputs.block.done = true;

        inputs.block.next = 'optin::start_step_05_1';
        await sails.helpers.funnel.afterHelperGeneric(inputs.client, inputs.block, inputs.msg);

      } else if (/222/i.test(inputs.msg.text)) {

        inputs.block.done = true;

        inputs.block.next = 'optin::start_step_05_2';
        await sails.helpers.funnel.afterHelperGeneric(inputs.client, inputs.block, inputs.msg);

      }


    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/optin/forced-step-04',
          message: 'api/helpers/funnel/optin/forced-step-04 error',
          payload: {
            client: inputs.client,
            block: inputs.block,
            msg: inputs.msg,
            error: e,
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

