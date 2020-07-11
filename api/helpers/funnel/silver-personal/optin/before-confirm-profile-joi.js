"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:block-modify-confirm-profile-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:block-modify-confirm-profile-joi',


  description: 'funnel:silver-personal:optin:block-modify-confirm-profile-joi',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
      type: 'ref',
      required: true,
    },

  },


  exits: {
    success: {
      description: 'All done.',
    },
    err: {
      description: 'Error',
    }
  },


  fn: async function (inputs, exits) {

    const schema = Joi.object({
      client: Joi
        .any()
        .description('Client record')
        .required(),
      block: Joi
        .any()
        .description('Current funnel block')
        .required(),
      msg: Joi
        .any()
        .description('Message received'),
      payload: Joi
        .any()
        .description('{text, inline_keyboard, img, video, doc} object')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      const instProfile = sails.config.custom.config.general.instagram_prefix + _.trim(input.client.inst_profile_tmp);
      const instPic = currentAccount.inst_pic;

      const resHtml = MessageProcessor.parseSpecialTokens({
        client: input.client,
        message: input.payload.text,
        additionalTokens: [
          {
            token: '$instagramProfile$',
            value: instProfile,
          },
          {
            token: '$instagramProfilePic$',
            value: instPic,
          },
        ],
      });

      const img = MessageProcessor.parseSpecialTokens({
        client: input.client,
        message: input.payload.img,
        additionalTokens: [
          {
            token: 'profilePicUrl',
            value: instPic,
          },
        ],
      });

      return exits.success({
        text: resHtml,
        inline_keyboard: input.payload.inline_keyboard,
        img,
        video: inputs.payload.video,
        doc: inputs.payload.doc,
      });

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};

