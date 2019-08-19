module.exports = {


  friendlyName: 'general::callbackSelectAccount',


  description: 'general::callbackSelectAccount',


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

      sails.log.info('/*************** general::callbackSelectAccount ***************/');

      // sails.log.debug('Client: ', inputs.client);
      // sails.log.debug('Block: ', inputs.block);
      // sails.log.debug('Query: ', inputs.query);


      // sails.log.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      // sails.log.warn('Account selected: ', inputs.query.data);
      // sails.log.warn('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

      const accGuid = _.split(inputs.query.data, 'acc_');
      // sails.log.warn('addGuid: ', accGuid);

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

      const initialHelpFunnelRes = await sails.helpers.general.loadInitialFunnels.with({
        client: inputs.client,
        clientCategory: currentAccount.service.funnel_name,
        funnelName: 'general',
      });

      if (initialHelpFunnelRes.status !== 'ok') {

        throw new Error(`Wrong loadInitialFunnels result: ${initialHelpFunnelRes}`);

      }

      inputs.client.funnels = initialHelpFunnelRes.payload.client.funnels;

      inputs.client.account_use = accGuid[1];

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

      const checkDayPostsRes = await sails.helpers.general.checkDayPosts(inputs.client);

      if (checkDayPostsRes.status === 'ok') {

        if (checkDayPostsRes.payload.dayPostsReached) {

          /**
           * Нужно переходить на max_posts
           */

          inputs.block.done = true;
          inputs.block.next = 'general::max_posts';

          /**
           * Update general::start
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
            getBlock.next = 'general::max_posts';
          }


          /**
           * Update next block
           */

          updateBlock = inputs.block.next;

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.shown = false;
            getBlock.done = false;
            getBlock.next = null;
            getBlock.previous = 'general::start';
          }

        } else {

          /**
           * Можно переходить на start
           */

          inputs.block.done = true;
          inputs.block.next = 'general::start';

          /**
           * Update next block
           */

          updateBlock = inputs.block.next;

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];


          getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.enabled = true;
            getBlock.shown = false;
            getBlock.done = false;
            getBlock.next = null;
          }

        }

        } else {

        throw new Error(`Wrong reply from sails.helpers.general.checkDayPosts: ${checkDayPostsRes}`);

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

      sails.log.error('api/helpers/funnel/general/callback-select-account, error: ', e);

      throw {err: {
          module: 'api/helpers/funnel/general/callback-select-account',
          message: 'api/helpers/funnel/general/callback-select-account error',
          payload: {},
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

