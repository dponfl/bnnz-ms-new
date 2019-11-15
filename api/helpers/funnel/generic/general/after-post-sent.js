"use strict";

module.exports = {

  friendlyName: 'general::afterPostSent',

  description: 'general::afterPostSent',

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
    },
  },

  exits: {

    success: {
      description: 'All done.',
    },

  },

  fn: async function (inputs,exits) {

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      sails.log.info('/*************** general::afterPostSent ***************/');

      /**
       * Проверить не достигнуто ли максимальное суточное кол-во отправленных сообщений
       */

      const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});
      const currentAccountInd = _.findIndex(inputs.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      if (inputs.client.accounts[currentAccountInd]['posts_made_day'] >=
        inputs.client.accounts[currentAccountInd]['service']['max_outgoing_posts_per_day']
      ) {

        /**
         * На этом аккаунте нельзя больше отправлять постов в текущий день
         */

        inputs.block.done = true;
        inputs.block.next = "general::max_posts";

        /**
         * Update general::max_posts
         */

        updateBlock = 'general::max_posts';

        splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
        updateFunnel = splitRes[0];
        updateId = splitRes[1];


        getBlock = _.find(inputs.client.funnels[updateFunnel], {id: updateId});

        if (getBlock) {
          getBlock.previous = "general::post_sent";
          getBlock.shown = false;
          getBlock.done = false;
          getBlock.next = null;
        }
      } else {

        /**
         * На этом аккаунте можно еще отправлять посты в текущий день
         */

        inputs.block.done = true;
        inputs.block.next = "general::post_next";
      }


      await sails.helpers.funnel.afterHelperGeneric.with({
        client: inputs.client,
        block: inputs.block,
        msg: inputs.msg,
        next: true,
        previous: true,
        switchFunnel: true,
      });
    } catch (e) {

      sails.log.error('api/helpers/funnel/general/after-post-sent, error: ', e);

      throw {err: {
          module: 'api/helpers/funnel/general/after-post-sent',
          message: 'api/helpers/funnel/general/after-post-sent error',
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

