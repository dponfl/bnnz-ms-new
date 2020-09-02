"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'keyboards:silver-personal:ref-profile-subscription-check:before-check-profiles-subscription-joi';


module.exports = {


  friendlyName: 'keyboards:silver-personal:ref-profile-subscription-check:before-check-profiles-subscription-joi',


  description: 'keyboards:silver-personal:ref-profile-subscription-check:before-check-profiles-subscription-joi',


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
      keyboard: Joi
        .any()
        .description('keyboard')
        .required(),
      payload: Joi
        .any()
        .description('{text} object')
        .required(),
      additionalData: Joi
        .any()
        .description('additional data')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const profiles = input.additionalData.profiles;

      let resHtml = input.payload.text;

      let refProfilesList = '';

      for (const refListElem of profiles) {
        refProfilesList = refProfilesList + `<a href="${sails.config.custom.config.general.instagram_prefix}${refListElem}">:point_right: ${refListElem}</a>${sails.config.custom.SCR}`;
      }

      refProfilesList = refProfilesList + sails.config.custom.SCR;

      refProfilesList = await KeyboardProcessor.parseEmoji({
        str: refProfilesList,
      });

      resHtml = _.replace(resHtml, '$RefMissedProfilesList$', refProfilesList);

      return exits.success({
        text: resHtml,
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
          }
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          }
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

