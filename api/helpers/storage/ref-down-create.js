"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'storage:refDownCreate';


module.exports = {


  friendlyName: 'storage:refDownCreate',


  description: 'Create refDown record',


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

    level: {
      friendlyName: 'relation level',
      description: 'relation level',
      type: 'string',
      required: true,
    },

    type: {
      friendlyName: 'relation type',
      description: 'relation type',
      type: 'string',
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

    try {

      const uuidApiKey = uuid.create();

      const refDownRec = {
        guid: uuidApiKey.uuid,
        account_guid: inputs.accountGuid,
        ref_account_guid: inputs.refAccountGuid,
        level: inputs.level,
        type: inputs.type,
      };

      const refDownRecRaw = await RefDown.create(refDownRec).fetch()
        .tolerate(async (err) => {

          err.details = {
            refDownRec,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'RefDown.create() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              refDownRec,
            },
          });

          return refDownRec;
        });

      return exits.success({
        status: 'ok',
        message: 'RefDown record created',
        payload: refDownRecRaw,
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

