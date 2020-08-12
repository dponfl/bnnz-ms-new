"use strict";

const uuid = require('uuid-apikey');

const moduleName = 'storage:refCreate';


module.exports = {


  friendlyName: 'storage:refCreate',


  description: 'Create initial ref record',


  inputs: {

    accountGuid: {
      friendlyName: 'account guid',
      description: 'Account guid',
      type: 'string',
      required: true,
    },

    directLinkedAccountsNum: {
      friendlyName: 'direct_linked_accounts_num',
      description: 'direct_linked_accounts_num',
      type: 'number',
    },

    totalLinkedAccountsNum: {
      friendlyName: 'total_linked_accounts_num',
      description: 'total_linked_accounts_num',
      type: 'number',
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

      const refRec = {
        guid: uuidApiKey.uuid,
        account_guid: inputs.accountGuid,
        direct_linked_accounts_num: inputs.directLinkedAccountsNum || 0,
        total_linked_accounts_num: inputs.totalLinkedAccountsNum || 0,
      };

      const refRecRaw = await Ref.create(refRec).fetch();

      return exits.success({
        status: 'ok',
        message: 'Ref record created',
        payload: refRecRaw,
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

