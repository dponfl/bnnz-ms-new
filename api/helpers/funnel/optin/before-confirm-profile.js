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

    const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});

    let resHtml = inputs.htmlMsg;
    const instProfile = 'https://www.instagram.com/' + _.trim(currentAccount.inst_profile);

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

