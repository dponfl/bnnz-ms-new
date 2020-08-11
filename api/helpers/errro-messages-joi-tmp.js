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

    const payloadObj = {};
    const clientGuid = 'XXX';
    const accountGuid = 'XXX';
    const message = 'XXX';
    const errorName = 'XXX';
    const e = 'XXX';

    /**
     * Логирование сообщения (info/debug/warn/error)
     */

    await LogProcessor.error({
      message: message,
      clientGuid,
      accountGuid,
      // requestId: null,
      // childRequestId: null,
      errorName: errorName,
      location: moduleName,
      payload: payloadObj,
    });


    /**
     * Логирование сообщения (critical)
     */

    await LogProcessor.error({
      message: message,
      clientGuid,
      accountGuid,
      // requestId: null,
      // childRequestId: null,
      errorName: errorName,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: moduleName,
      payload: payloadObj,
    });



    /**
     * Ordinary error event
     */

    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.ERROR,
      location: moduleName,
      message: message,
      clientGuid,
      accountGuid,
      errorName: errorName,
      payload: payloadObj,
    });

    /**
     * CRITICAL error event
     */

    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.CRITICAL,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: moduleName,
      message: message,
      clientGuid,
      accountGuid,
      errorName: errorName,
      payload: payloadObj,
    });


    /**
     * Helper response error
     */


    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.ERROR,
      location: moduleName,
      message: 'Wrong XXX response',
      clientGuid,
      accountGuid,
      errorName: exports.custom.FUNNELS_ERROR,
      payload: {
        xxx,
      },
    });


    /**
     * Wrong callback data
     */

    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.CRITICAL,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: moduleName,
      message: 'Wrong callback data',
      clientGuid,
      accountGuid,
      errorName: sails.config.custom.FUNNELS_ERROR,
      payload: {
        inputQueryData: input.query.data,
      },
    });





    /**
     * Block not found
     */

    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.CRITICAL,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: moduleName,
      message: 'Block not found',
      clientGuid,
      accountGuid,
      errorName: sails.config.custom.FUNNELS_ERROR,
      payload: {
        updateId,
        updateFunnel,
        funnel: input.client.funnels[updateFunnel],
      },
    });


    /**
     * Block parsing error
     */



    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.CRITICAL,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: moduleName,
      message: 'Block parsing error',
      clientGuid,
      accountGuid,
      errorName: sails.config.custom.FUNNELS_ERROR,
      payload: {
        updateBlock,
        block: input.block,
      },
    });





    /**
     * Catch block content
     */

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





    /**
     * Объявление переменных и присвоение им значений
     */

    if (true) {

      let clientGuid;
      let accountGuid;

      const input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


    }


  }

};

