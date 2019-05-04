module.exports = {


  friendlyName: 'help::callbackProfileExists',


  description: 'help::callbackProfileExists',


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

      sails.log.debug('/*************** help::callbackProfileExists ***************/');

      // sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Block: ', inputs.block);
      sails.log.debug('Query: ', inputs.query);


      switch (inputs.query.data) {

        case 'help_profile_exists_add_account_yes':

          /**
           * Update help::get_login block
           */

          updateBlock = 'help::get_login';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {

            getBlock.shown = false;
            getBlock.done = false;
            getBlock.next = null;

          } else {

            throw new Error(`Wrong block decoding for data: ${updateBlock}`);

          }

          inputs.block.next = 'help::get_login';
          inputs.block.done = true;

          break;

        case 'help_profile_exists_add_account_no':

          inputs.block.next = inputs.block.previous;
          inputs.block.enabled = false;
          inputs.block.done = false;

          /**
           * Update block specified at 'previous' key
           */

          updateBlock = inputs.block.previous;

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {

            getBlock.enabled = true;
            getBlock.done = false;
            getBlock.next = null;

          } else {

            throw new Error(`Wrong block decoding for data: ${updateBlock}`);

          }

          break;

        default:
          throw new Error(`Wrong callback data: ${inputs.query.data}`);
      }

      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.query,
        next: true,
        previous: false,
        switchFunnel: true,
      });


    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/help/callback-profile-exists',
          message: 'api/helpers/funnel/help/callback-profile-exists error',
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
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

