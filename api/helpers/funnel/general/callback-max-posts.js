module.exports = {


  friendlyName: 'general::callbackMaxPosts',


  description: 'general::callbackMaxPosts',


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
    let updateBlockPrevious;

    const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});

    try {

      sails.log.info('/*************** general::callbackMaxPosts ***************/');

      // sails.log.debug('Client: ', inputs.client);
      // sails.log.debug('Block: ', inputs.block);
      // sails.log.debug('Query: ', inputs.query);



      switch (inputs.query.data) {
        case 'check_new_post':
          let checkDayPostsRes = await sails.helpers.general.checkDayPosts(inputs.client);
          if (checkDayPostsRes.status === 'ok') {

            if (checkDayPostsRes.payload.dayPostsReached) {

              /**
               * The client cannot send more posts today
               */

              await sails.helpers.funnel.afterHelperGeneric.with({
                client: inputs.client,
                block: inputs.block,
                msg: inputs.query,
                next: true,
                previous: false,
                switchFunnel: true,
              });

            } else {

              /**
               * The client can send more posts today
               */

              /**
               * Get value of 'previous' of general::start block
               */

              updateBlock = 'general::start';

              splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
              updateFunnel = splitRes[0];
              updateId = splitRes[1];

              getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

              if (getBlock) {

                getBlock.enabled = true;
                getBlock.done = false;
                getBlock.next = null;
                getBlock.switchToFunnel = null;
                inputs.block.switchToFunnel = updateFunnel;
                updateBlockPrevious = getBlock.previous;

              } else {

                throw new Error(`Wrong block decoding for data: ${updateBlock}`);

              }

              inputs.block.done = true;

              /**
               * Update General funnel to the initial state to enable the client to perform it again
               */

              const initialGeneralFunnelRes = await sails.helpers.general.loadInitialFunnels.with({
                client: inputs.client,
                clientCategory: currentAccount.service.funnel_name,
                funnelName: 'general',
              });

              inputs.client.funnels = initialGeneralFunnelRes .payload.client.funnels;

              /**
               * Сохранить сохраненное значение ключа previous блока start
               */

              updateBlock = 'general::start';

              splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
              updateFunnel = splitRes[0];
              updateId = splitRes[1];

              getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

              if (getBlock) {

                getBlock.previous = updateBlockPrevious;

              } else {

                throw new Error(`Wrong block decoding for data: ${updateBlock}`);

              }

              await sails.helpers.funnel.afterHelperGeneric.with({
                client: inputs.client,
                block: inputs.block,
                msg: inputs.query,
                next: true,
                previous: false,
                switchFunnel: true,
              });

            }

          } else {

            throw new Error(`Wrong reply from sails.helpers.general.checkDayPosts: ${checkDayPostsRes}`);

          }

          break;

        case 'сhange_account':

          /**
           * Get value of 'previous' of general::start block
           */

          updateBlock = 'general::start';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];

          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {

            updateBlockPrevious = getBlock.previous;

          } else {

            throw new Error(`Wrong block decoding for data: ${updateBlock}`);

          }

          inputs.block.done = true;

          /**
           * Update General funnel to the initial state to enable the client to perform it again
           */

          const initialGeneralFunnelRes = await sails.helpers.general.loadInitialFunnels.with({
            client: inputs.client,
            clientCategory: currentAccount.service.funnel_name,
            funnelName: 'general',
          });

          inputs.client.funnels = initialGeneralFunnelRes .payload.client.funnels;

          /**
           * Сохранить сохраненное значение ключа previous блока start
           */

          updateBlock = 'general::start';

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];

          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.enabled = true;
            getBlock.shown = true;
            getBlock.done = true;
            getBlock.next = "general::select_account";
            getBlock.switchToFunnel = null;
            getBlock.previous = updateBlockPrevious;

          } else {

            throw new Error(`Wrong block decoding for data: ${updateBlock}`);

          }

          await sails.helpers.funnel.afterHelperGeneric.with({
            client: inputs.client,
            block: inputs.block,
            msg: inputs.query,
            next: true,
            previous: true,
            switchFunnel: true,
          });
          break;

      }

    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/general/callback-max-posts',
          message: 'api/helpers/funnel/general/callback-max-posts error',
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

