"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'storage:refUpCreate';


module.exports = {


  friendlyName: 'storage:refUpCreate',


  description: 'Create refUp record',


  inputs: {

    accountGuid: {
      friendlyName: 'account guid',
      description: 'account guid',
      type: 'string',
      required: true,
    },

    refAccountGuid: {
      friendlyName: 'ref account guid',
      description: 'ref account guid',
      type: 'string',
      required: true,
    },

    index: {
      friendlyName: 'relation index',
      description: 'relation index',
      type: 'string',
      required: true,
    },

    signed: {
      friendlyName: 'signed flag',
      description: 'signed flag',
      type: 'boolean',
    },

    active: {
      friendlyName: 'flag that signed status is active',
      description: 'flag that signed status is active',
      type: 'boolean',
    },

    checkedAt: {
      friendlyName: 'date the signed status was checked',
      description: 'date the signed status was checked',
      type: 'string',
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

    try {

      const uuidApiKey = uuid.create();

      const refUpRec = {
        guid: uuidApiKey.uuid,
        account_guid: inputs.accountGuid,
        ref_account_guid: inputs.refAccountGuid,
        index: inputs.index,
        signed: inputs.signed || false,
        active: inputs.active || false,
        checkedAt: inputs.checkedAt || '',
      };

      const refUpRecRaw = await RefUp.create(refUpRec).fetch();

      return exits.success({
        status: 'ok',
        message: 'RefUp record created',
        payload: refUpRecRaw,
      })

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
      //     payload: {},
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

