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

    let res = input.messageData;

    try {

      const input = await schema.validateAsync(inputs.params);

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


        res = await sails.helpers.pushMessages[blockModifyHelperBlock][blockModifyHelperName](beforeHelperParams);

      } else {
        throw new Error(`${moduleName}, critical error: could not parse callback helper name: 
            callbackHelperBlock: ${blockModifyHelperBlock}
            callbackHelperName: ${blockModifyHelperName}`);
      }

      return exits.success(res);

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

