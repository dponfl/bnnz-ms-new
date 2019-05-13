module.exports = {


  friendlyName: 'general::callbackStart',


  description: 'general::callbackStart',


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
    try {

      sails.log.debug('/*************** general::callbackStart ***************/');

      // sails.log.debug('Client: ', inputs.client);
      sails.log.debug('Block: ', inputs.block);
      sails.log.debug('Query: ', inputs.query);


      switch (inputs.query.data) {
        case 'start_upload':
          let checkDayPostsRes = await sails.helpers.general.checkDayPosts(inputs.client);
          if (checkDayPostsRes.status === 'ok') {

            if (checkDayPostsRes.payload.dayPostsReached) {

              /**
               * The client cannot send more posts today
               */

              inputs.block.next = 'general::max_posts';

              /**
               * Update general::max_posts block
               */

              updateBlock = 'general::max_posts';

              splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
              updateFunnel = splitRes[0];
              updateId = splitRes[1];


              getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

              if (getBlock) {
                getBlock.shown = false;
                getBlock.done = false;
                getBlock.previous = 'general::start';
              }

            } else {

              /**
               * The client can send more posts today
               */

              inputs.block.next = 'general::make_post';

            }

          } else {

            throw new Error(`Wrong reply from sails.helpers.general.checkDayPosts: ${checkDayPostsRes}`);

          }
          break;

        case 'start_get_help':

          inputs.block.next = 'help::start';
          inputs.block.switchToFunnel = 'help';

          /**
           * Update help::start block
           */

          updateBlock = 'help::start';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.previous = 'general::start';
          }

          break;

        case 'start_change_account':

          inputs.block.done = true;
          inputs.block.next = 'general::select_account';

          break;

        default:
          throw new Error(`Wrong callback data: ${inputs.query.data}`);
      }

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
          module: 'api/helpers/funnel/general/callback-start',
          message: 'api/helpers/funnel/general/callback-start error',
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

