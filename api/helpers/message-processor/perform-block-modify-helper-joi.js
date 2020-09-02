"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'message-processor:perform-block-modify-helper-joi';


module.exports = {


  friendlyName: 'message-processor:perform-block-modify-helper-joi',


  description: 'Performs blockModifyHelper',


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

    let res;

    let clientGuid;
    let accountGuid;


    try {

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      res = input.messageData;

      let splitBlockModifyHelperRes = _.split(input.messageData.blockModifyHelper, sails.config.custom.JUNCTION, 2);
      let blockModifyHelperCategory = splitBlockModifyHelperRes[0];
      let blockModifyHelperBlock = splitBlockModifyHelperRes[1];
      let blockModifyHelperName = splitBlockModifyHelperRes[2];

      if (blockModifyHelperCategory && blockModifyHelperBlock && blockModifyHelperName) {

        /**
         * We managed to parse the specified callbackHelper and can perform it
         */

        let beforeHelperParams = {
          client: input.client,
          messageData: input.messageData,
          additionalParams: input.additionalParams,
        };

        // const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

        // const pushMessageName = currentAccount.service.push_message_name;

        res = await sails.helpers.pushMessages[blockModifyHelperCategory][blockModifyHelperBlock][blockModifyHelperName](beforeHelperParams);

      } else {
        // throw new Error(`${moduleName}, critical error: could not parse callback helper name:
        //     callbackHelperBlock: ${blockModifyHelperBlock}
        //     callbackHelperName: ${blockModifyHelperName}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Cannot parse callback helper name',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.MESSAGE_PROCESSOR_ERROR.name,
          payload: {
            blockModifyHelper: input.messageData.blockModifyHelper,
            blockModifyHelperBlock,
            blockModifyHelperName,
          },
        });

      }

      return exits.success(res);

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

