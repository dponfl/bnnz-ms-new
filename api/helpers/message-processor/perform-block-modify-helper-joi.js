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

      // if (input.messageData != null) {
      //
      //   let splitBlockModifyHelperRes = _.split(input.messageData.blockModifyHelper, sails.config.custom.JUNCTION, 2);
      //   let blockModifyHelperBlock = splitBlockModifyHelperRes[0];
      //   let blockModifyHelperName = splitBlockModifyHelperRes[1];
      //
      //   if (blockModifyHelperBlock && blockModifyHelperName) {
      //
      //     /**
      //      * We managed to parse the specified blockModifyHelper and can perform it
      //      */
      //
      //     let beforeHelperParams = {
      //       client: input.client,
      //       messageData: input.messageData,
      //       additionalParams: input.additionalParams,
      //     };
      //
      //     res = await sails.helpers.funnel[client.funnel_name][blockModifyHelperBlock][blockModifyHelperName].with(beforeHelperParams);
      //
      //   } else {
      //
      //     /**
      //      * Throw error: we could not parse the specified blockModifyHelper
      //      */
      //
      //     const errorLocation = 'api/helpers/funnel/proceed-next-block';
      //     const errorMsg = sails.config.custom.PROCEED_NEXT_BLOCK_BLOCKMODIFYEHELPER_PARSE_ERROR;
      //
      //     sails.log.error(errorLocation + ', error: ' + errorMsg);
      //
      //     throw {err: {
      //         module: errorLocation,
      //         message: errorMsg,
      //         payload: {},
      //       }
      //     };
      //   }
      //
      // }


      let splitBlockModifyHelperRes = _.split(input.messageData.blockModifyHelper, sails.config.custom.JUNCTION, 2);
      let blockModifyHelperBlock = splitBlockModifyHelperRes[0];
      let blockModifyHelperName = splitBlockModifyHelperRes[1];

      if (blockModifyHelperBlock && blockModifyHelperName) {

        /**
         * We managed to parse the specified callbackHelper and can perform it
         */

        let beforeHelperParams = {
          client: input.client,
          messageData: input.messageData,
          additionalParams: input.additionalParams,
        };

        const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

        const pushMessageName = currentAccount.service.push_message_name;

        res = await sails.helpers.pushMessages[pushMessageName][blockModifyHelperBlock][blockModifyHelperName](beforeHelperParams);

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

