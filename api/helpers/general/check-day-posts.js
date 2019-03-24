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

      return exits.success({
        status: 'ok',
        message: '',
        payload: {
          dayPostsReached: inputs.client.posts_made_day >= inputs.client.service.messages_per_day,
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
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

  }

};

