module.exports = {


  friendlyName: 'optin::beforeConfirmProfile',


  description: 'optin::beforeConfirmProfile',


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
    htmlMsg: {
      friendlyName: 'html message',
      description: 'HTML message',
      type: 'string',
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
    let instProfile = 'https://www.instagram.com/' + _.trim(inputs.client.inst_profile);

    try {

      sails.log.debug('/*************** optin::beforeConfirmProfile ***************/');

      /**
       * Add Instagram profile link to html message
       */

      resHtml = _.replace(inputs.htmlMsg, '$instagramProfile$', instProfile);

      return exits.success(resHtml);

    } catch (e) {

      throw {err: {
          module: 'api/helpers/funnel/optin/before-confirm-profile',
          message: 'api/helpers/funnel/optin/before-confirm-profile error',
          payload: {
            client: inputs.client,
            block: inputs.block,
            msg: inputs.msg || 'no message',
            html: inputs.htmlMsg,
            error: e.message || 'no error message',
          }
        }
      };

    }

  }


};

