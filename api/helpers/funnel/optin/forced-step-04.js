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

      inputs.block.done = true;

      if (/111/i.test(inputs.msg.text)) {

        inputs.block.next = 'optin::start_step_05_1';
        await sails.helpers.funnel.afterHelperGeneric(inputs.client, inputs.block, inputs.msg);

      } else if (/222/i.test(inputs.msg.text)) {

        inputs.block.next = 'optin::start_step_05_2';
        await sails.helpers.funnel.afterHelperGeneric(inputs.client, inputs.block, inputs.msg);

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

