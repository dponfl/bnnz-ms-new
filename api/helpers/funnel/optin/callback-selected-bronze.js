module.exports = {


  friendlyName: 'optin::callbackSelectedBronze',


  description: 'optin::callbackSelectedBronze',


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
    query: {
      friendlyName: 'query',
      description: 'Callback query received',
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

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      sails.log.debug('/*************** optin::callbackSelectedBronze ***************/');

      // sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Block: ', inputs.block);
      sails.log.debug('Query: ', inputs.query);


      switch (inputs.query.data) {
        case 'change_service':
          inputs.block.next = 'optin::want_change_service_level';

          /**
           * Update optin::want_change_service_level block
           */

          updateBlock = 'optin::want_change_service_level';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.previous = 'optin::selected_bronze';
          }

          break;
        default:
          throw new Error(`Wrong callback data: ${inputs.query.data}`);
      }

      inputs.block.done = true;

      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.query,
        next: true,
        previous: true,
        switchFunnel: true,
      });


    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/optin/callback-selected-bronze',
          message: 'api/helpers/funnel/optin/callback-selected-bronze error',
          payload: {
            client: inputs.client,
            block: inputs.block,
            query: inputs.query,
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

