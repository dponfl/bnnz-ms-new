module.exports = {


  friendlyName: 'Post broadcast',


  description: 'Sent out the post made by user to all citizens of his rooms',


  inputs: {
    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
    accountId: {
      friendlyName: 'accountId',
      description: 'accountId',
      type: 'number',
      required: true,
    },
    postLink: {
      friendlyName: 'postLink',
      description: 'postLink',
      type: 'string',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log('general:postBroadcast helper...');

    try {

      const account = inputs.client.accounts[inputs.accountId];

      if (account == null) {
        sails.log.error('api/helpers/general/post-broadcast, error: Cannot find account by input.accountId');
        throw new Error('api/helpers/general/post-broadcast, error: Cannot find account by input.accountId');
      }

      /**
       * Check if the client reached the max outgoing posts on active account
       */

      if (account.posts_made_day >= account.service.max_outgoing_posts_per_day) {
        return exits.success({
          status: 'nok',
          message: 'Max amount of outgoing posts reached',
          payload: {
            posts_made_day: account.posts_made_day,
            max_outgoing_posts_per_day: account.service.max_outgoing_posts_per_day,
          },
        });
      }

      /**
       *
       */

      return exits.success({
        status: 'ok',
        message: '',
        payload: {
          dayPostsReached: account.posts_made_day >= account.service.messages_per_day,
        }
      });

    } catch (e) {

      sails.log.error('api/helpers/general/post-broadcast, error: ', e);

      throw {err: {
          module: 'api/helpers/general/post-broadcast',
          message: sails.config.custom.GENERAL_HELPER_ERROR,
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

  }

};

