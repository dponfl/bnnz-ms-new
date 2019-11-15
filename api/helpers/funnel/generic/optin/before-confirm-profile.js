"use strict";

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

    const currentAccount = _.find(inputs.client.accounts, {guid: inputs.client.account_use});

    let resHtml = inputs.payload.text;
    const instProfile = 'https://www.instagram.com/' + _.trim(currentAccount.inst_profile);

    try {

      sails.log.info('/*************** optin::beforeConfirmProfile ***************/');

      /**
       * Add Instagram profile link to html message
       */

      resHtml = _.replace(inputs.payload.text, '$instagramProfile$', instProfile);

      return exits.success({
        text: resHtml,
        inline_keyboard: inputs.payload.inline_keyboard,
      });

    } catch (e) {

      const errorLocation = 'api/helpers/funnel/optin/before-confirm-profile';
      const errorMsg = 'Error';

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

