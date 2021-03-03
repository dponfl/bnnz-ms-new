"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'module:helper';


module.exports = {


  friendlyName: 'module:helper',


  description: 'module:helper',


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
      messageContent: Joi
        .any()
        .description('{text, inline_keyboard, img, video, doc} object')
        .required(),
      additionalParams: Joi
        .any()
        .description('params'),
    });

    let input;

    let client;
    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;


      const resHtml = await MessageProcessor.parseSpecialTokens({
        client,
        message: input.messageContent.text,
        additionalTokens: [
          {
            token: '$instagramProfile$',
            value: instProfile,
          },
        ],
      });


      return exits.success({
        text: resHtml,
        inline_keyboard: input.messageContent.inline_keyboard,
        img: input.messageContent.img,
        video: input.messageContent.video,
        doc: input.messageContent.doc,
      });

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
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

