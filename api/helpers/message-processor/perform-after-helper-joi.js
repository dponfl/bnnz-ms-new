"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'message-processor:perform-after-helper-joi';


module.exports = {


  friendlyName: 'message-processor:perform-after-helper-joi',


  description: 'Performs afterHelper',


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
      client: Joi.any().required(),
      messageData: Joi.any().required(),
      additionalParams: Joi.any(),
    });

    let clientGuid;
    let accountGuid;


    try {

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      let splitAfterHelperRes = _.split(input.messageData.afterHelper, sails.config.custom.JUNCTION, 3);
      let afterHelperCategory = splitAfterHelperRes[0];
      let afterHelperBlock = splitAfterHelperRes[1];
      let afterHelperName = splitAfterHelperRes[2];

      if (afterHelperCategory && afterHelperBlock && afterHelperName) {

        /**
         * We managed to parse the specified callbackHelper and can perform it
         */

        let afterHelperParams = {
          client: input.client,
          messageData: input.messageData,
          additionalParams: input.additionalParams,
        };

        await sails.helpers.pushMessages[afterHelperCategory][afterHelperBlock][afterHelperName](afterHelperParams);

      } else {

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Cannot parse callback helper name',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.MESSAGE_PROCESSOR_ERROR.name,
          payload: {
            afterHelper: input.messageData.afterHelper,
            afterHelperBlock,
            afterHelperName,
          },
        });

      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {
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

