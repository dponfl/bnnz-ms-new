module.exports = {


  friendlyName: 'Check day posts',


  description: 'Check if the client reached the day daily posts',


  inputs: {
    client: {
      friendlyName: 'client',
      description: 'Client record',
      type: 'ref',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log('general:checDayPosts helper...');

    try {

      const account = _.find(inputs.client.accounts, {guid: inputs.client.account_use});

      if (typeof account === 'undefined') {

        sails.log.error('api/helpers/general/check-day-posts, error: Cannot find account by client.account_use');
        throw new Error('api/helpers/general/check-day-posts, error: Cannot find account by client.account_use');

      }

      return exits.success({
        status: 'ok',
        message: '',
        payload: {
          dayPostsReached: account.posts_made_day >= account.service.max_outcoming_posts_per_day,
        }
      });

    } catch (e) {

      sails.log.error('api/helpers/general/check-day-posts, error: ', e);

      throw {err: {
          module: 'api/helpers/general/check-day-posts',
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

