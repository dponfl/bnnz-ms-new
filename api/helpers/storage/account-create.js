"use strict";

const uuid = require('uuid-apikey');

module.exports = {


  friendlyName: 'Account create',


  description: 'Create new record for the account',


  inputs: {

    account: {
      friendlyName: 'account',
      description: 'Account record',
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

    try {

      const uuidApiKey = uuid.create();

      const accountRec = {
        guid: uuidApiKey.uuid,
        ref_key: uuidApiKey.apiKey,
        region: inputs.account.region || 'RU',
        subscription_active: inputs.account.subscription_active || false,
        subscription_from: inputs.account.subscription_from || null,
        subscription_until: inputs.account.subscription_until || null,
        service: inputs.account.service || null,
        payment_plan: inputs.account.payment_plan || null,
        payment_made: inputs.account.payment_made || false,
        next_subscription_from: inputs.account.next_subscription_from || null,
        next_subscription_until: inputs.account.next_subscription_until || null,
        next_service: inputs.account.next_service || null,
        next_payment_plan: inputs.account.next_payment_plan || null,
        next_payment_made: inputs.account.next_payment_made || false,
        deleted: inputs.account.deleted || false,
        banned: inputs.account.banned || false,
        inst_profile: inputs.account.inst_profile || '',
        posts_made_day: inputs.account.posts_made_day || 0,
        posts_received_day: inputs.account.posts_received_day || 0,
        posts_made_total: inputs.account.posts_made_total || 0,
        posts_received_total: inputs.account.posts_received_total || 0,
        profile_provided: inputs.account.profile_provided || false,
        profile_confirmed: inputs.account.profile_confirmed || false,
        payment_plan_selected: inputs.account.payment_plan_selected || false,
        subscription_confirmed_by_client: inputs.account.subscription_confirmed_by_client || false,
        subscription_made: inputs.account.subscription_made || false,
        service_subscription_finalized: inputs.account.service_subscription_finalized || false,
        client: inputs.account.client || null,
      };

      const accountGuid = accountRec.guid;

      // sails.log.warn('<<<<<<< !!!!!!!!!!!! >>>>>>> Data for create account: ', accountRec);

      let account = await Account.create(accountRec).fetch()
        .tolerate(async (err) => {

          err.details = {
            accountRec,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Account.create() error',
            // clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              accountRec,
            },
          });

          return null;
        });

      if (account == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Account.create() error',
          // clientGuid,
          accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            accountRec,
          },
        });
      }

      account = await Account.findOne({guid: account.guid})
        .populate('room')
        .populate('service')
        .tolerate(async (err) => {

          err.details = {
            guid: account.guid,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Account.findOne() error',
            // clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              guid: account.guid,
            },
          });

          return null;
        });

      if (account == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Account.findOne() error',
          // clientGuid,
          accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {},
        });
      }

      return exits.success({
        status: 'ok',
        message: 'Account record created',
        payload: account,
      })

    } catch (e) {

      // const errorLocation = 'api/helpers/storage/account-create';
      // const errorMsg = sails.config.custom.ACCOUNTCREATE_ERROR;
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

