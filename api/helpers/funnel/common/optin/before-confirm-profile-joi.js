"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:common:optin:block-modify-confirm-profile-joi';


module.exports = {


  friendlyName: 'funnel:common:optin:block-modify-confirm-profile-joi',


  description: 'funnel:common:optin:block-modify-confirm-profile-joi',


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

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      const instProfile = sails.config.custom.config.general.instagram_prefix + _.trim(input.client.inst_profile_tmp);
      const instPic = currentAccount.inst_pic;

      const resHtml = await MessageProcessor.parseSpecialTokens({
        client: input.client,
        message: input.payload.text,
        additionalTokens: [
          {
            token: '$instagramProfile$',
            value: instProfile,
          },
        ],
      });

      const img = await MessageProcessor.parseSpecialTokens({
        client: input.client,
        message: input.payload.img,
        additionalTokens: [
          {
            token: '$profilePicUrl$',
            value: instPic,
          },
        ],
      });

      return exits.success({
        text: resHtml,
        inline_keyboard: input.payload.inline_keyboard,
        img,
        video: input.payload.video,
        doc: input.payload.doc,
      });

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};

