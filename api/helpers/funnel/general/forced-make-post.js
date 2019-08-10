module.exports = {


  friendlyName: 'help::forcedMakePost',


  description: 'help::forcedMakePost',


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

    let enteredPost = _.trim(inputs.msg.text);

    const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});
    const currentAccountInd = _.findIndex(inputs.client.accounts, (o) => {
      return o.guid === currentAccount.guid;
    });

    try {

      sails.log.debug('/*************** help::forcedMakePost ***************/');

      sails.log.debug(`inputs.msg.text: ${inputs.msg.text}`);
      sails.log.debug(`enteredPost: ${enteredPost}`);
      sails.log.debug(`currentAccount: ${currentAccount}`);
      sails.log.debug(`currentAccountInd: ${currentAccountInd}`);


      if (enteredPost === '') {

        /**
         * No Instagram post entered
         */

        inputs.block.done = true;
        inputs.block.next = 'general::wrong_post';

      } else {

        /**
         * Got Instagram post
         */

        /**
         * Check that the post contains https://www.instagram.com/
         */

        if (_.trim(enteredPost).match(RegExp(sails.config.custom.config.general.instagram_post_prefix))) {

          /**
           * Entered post looks ok
           */

          let postBroadcastResult = await sails.helpers.general.postBroadcast.with({
            client: inputs.client,
            accountId: currentAccountInd,
            postLink: enteredPost,
          });

          if (postBroadcastResult.status === 'ok') {

            /**
             * Увеличиваем счётчик отправленных сообщений по текущему аккаунту
             */

            inputs.client.accounts[currentAccountInd]['posts_made_day']++;
            inputs.client.accounts[currentAccountInd]['posts_made_total']++;

            /**
             * Можем переходить на следующий блок
             */

            inputs.block.next = 'general::post_sent';

          } else {
            throw new Error(`Wrong reply from sails.helpers.general.postBroadcast: ${postBroadcastResult}`);
          }

        } else {

          /**
           * Wrong Instagram post entered
           */

          inputs.block.done = true;
          inputs.block.next = 'general::wrong_post';

        }

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

      throw {err: {
          module: 'api/helpers/funnel/help/forced-make-post',
          message: 'api/helpers/funnel/help/forced-make-post error',
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

