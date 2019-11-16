"use strict";

module.exports = {


  friendlyName: 'Save data at AccountFields table',


  description: 'Save data at AccountFields table',


  inputs: {

    accountGuid: {
      friendlyName: 'accountGuid',
      description: 'accountGuid',
      type: 'string',
      required: true,
    },

    data: {
      friendlyName: 'data',
      description: 'Data to save',
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

      // sails.log.debug('*** storage:accountFieldsPut, inputs: ', inputs);

      const accountFieldsData = _.pick(inputs.data, [
        'guid',
        'subscription_active',
        'subscription_from',
        'subscription_until',
        'deleted',
        'inst_profile',
        'posts_made_day',
        'posts_received_day',
        'posts_made_total',
        'posts_received_total',
        'profile_provided',
        'profile_confirmed',
        'payment_plan_selected',
        'payment_plan',
        'payment_made',
        'subscription_confirmed_by_client',
        'subscription_made',
        'service_subscription_finalized',
        'service',
        'client',
      ]);

      // sails.log.debug('*** storage:accountFieldsPut, accountFieldsData: ', accountFieldsData);

      const accountRec = await Account.findOne({
        guid: inputs.accountGuid
      });

      if (!accountRec) {
        throw new Error(`No account record found for the conditions provided, inputs.accountGuid: ${inputs.accountGuid}`);
      }


      _.forEach(accountFieldsData, async (accountFieldValue, accountFieldKey) => {

        // sails.log.debug(`*** storage:accountFieldsPut, accountField: ${accountFieldKey}=${accountFieldValue}`);

        if (accountRec[accountFieldKey] !== accountFieldValue) {

          const accountFieldRec = {
            account_guid: inputs.accountGuid,
            field: accountFieldKey,
            old_value: _.toString(accountRec[accountFieldKey]),
            new_value: _.toString(accountFieldValue),
          };

          await AccountFields.create(accountFieldRec);

        }

      });

      return exits.success({
        status: 'ok',
        message: 'AccountFields record created',
        payload: {
          accountGuid: inputs.accountGuid,
          data: inputs.data
        },
      })

    } catch (e) {

      const errorLocation = 'api/helpers/storage/account-fields-put';
      const errorMsg = sails.config.custom.ACCOUNTFIELDSPUT_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

  }


};

