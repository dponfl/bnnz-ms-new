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

    sails.log.info('general:checkDayPosts helper...');

    try {

      const account = _.find(inputs.client.accounts, {guid: inputs.client.account_use});

      if (typeof account === 'undefined') {

        // sails.log.error('api/helpers/general/check-day-posts, error: Cannot find account by client.account_use');
        throw new Error('api/helpers/general/check-day-posts, error: Cannot find account by client.account_use');

      }

      return exits.success({
        status: 'ok',
        message: '',
        payload: {
          dayPostsReached: account.posts_made_day >= account.service.max_outgoing_posts_per_day,
        }
      });

    } catch (e) {

      const errorLocation = 'api/helpers/general/check-day-posts';
      const errorMsg = sails.config.custom.GENERAL_HELPER_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

    }

  }

};

