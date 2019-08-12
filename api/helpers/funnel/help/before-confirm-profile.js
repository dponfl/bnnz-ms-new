module.exports = {


  friendlyName: 'help::beforeConfirmProfile',


  description: 'help::beforeConfirmProfile',


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
      // required: true,
    },
    payload: {
      friendlyName: '{text, inline_keyboard} object',
      description: '{text, inline_keyboard} object',
      type: 'ref',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs,exits) {

    let resHtml = inputs.htmlMsg;
    const instProfile = 'https://www.instagram.com/' + _.trim(inputs.client.inst_profile_tmp);

    try {

      sails.log.info('/*************** help::beforeConfirmProfile ***************/');

      /**
       * Add Instagram profile link to html message
       */

      resHtml = _.replace(inputs.payload.text, '$instagramProfileNew$', instProfile);

      return exits.success({
        text: resHtml,
        inline_keyboard: inputs.payload.inline_keyboard,
      });

    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/help/before-confirm-profile',
          message: 'api/helpers/funnel/help/before-confirm-profile error',
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

