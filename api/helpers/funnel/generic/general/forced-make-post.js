"use strict";

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

    // const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});
    // const currentAccountInd = _.findIndex(inputs.client.accounts, (o) => {
    //   return o.guid === currentAccount.guid;
    // });

    try {

      sails.log.info('/*************** help::forcedMakePost ***************/');

      // sails.log.debug(`inputs.msg.text: ${inputs.msg.text}`);
      // sails.log.debug(`enteredPost: ${enteredPost}`);
      // sails.log.debug(`currentAccount: ${currentAccount}`);
      // sails.log.debug(`currentAccountInd: ${currentAccountInd}`);


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

          let generateTasksResult = await sails.helpers.tasks.generateTasks.with({
            client: inputs.client,
            postLink: enteredPost,
          });

          if (generateTasksResult.status === 'ok') {

            inputs.block.done = true;
            inputs.block.next = 'general::post_sent';

          } else {
            throw new Error(`Wrong reply from sails.helpers.tasks.generateTasks: ${generateTasksResult}`);
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

      sails.log.error('api/helpers/funnel/help/forced-make-post, error: ', e);

      throw {err: {
          module: 'api/helpers/funnel/help/forced-make-post',
          message: 'api/helpers/funnel/help/forced-make-post error',
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

