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
     * Catch block content
     */

    return await sails.helpers.general.catchErrorJoi({
      error: e,
      location: moduleName,
      throwError: false,
    });


  }

};

