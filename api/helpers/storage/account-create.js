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

      const accountRec = {
        guid: uuid.create().uuid,
        subscription_active: inputs.account.subscription_active || false,
        subscription_from: inputs.account.subscription_from || null,
        subscription_until: inputs.account.subscription_until || null,
        deleted: inputs.account.deleted || false,
        inst_profile: inputs.account.inst_profile || '',
        posts_made_day: inputs.account.posts_made_day || 0,
        posts_received_day: inputs.account.posts_received_day || 0,
        posts_made_total: inputs.account.posts_made_total || 0,
        posts_received_total: inputs.account.posts_received_total || 0,
        profile_provided: inputs.account.profile_provided || false,
        profile_confirmed: inputs.account.profile_confirmed || false,
        payment_plan_selected: inputs.account.payment_plan_selected || false,
        payment_plan: inputs.account.payment_plan || null,
        payment_made: inputs.account.payment_made || false,
        subscription_confirmed_by_client: inputs.account.subscription_confirmed_by_client || false,
        subscription_made: inputs.account.subscription_made || false,
        service_subscription_finalized: inputs.account.service_subscription_finalized || false,
        service: inputs.account.service || null,
        client: inputs.account.client || null,
      };

      sails.log.warn('<<<<<<< !!!!!!!!!!!! >>>>>>> Data for create account: ', accountRec);

      let account = await Account.create(accountRec).fetch();

      account = await Account.findOne({guid: account.guid})
        .populate('room')
        .populate('service');

      sails.log.warn('<<<<<<< !!!!!!!!!!!! >>>>>>> Created account data: ', account);

      return exits.success({
        status: 'ok',
        message: 'Account record created',
        payload: account,
      })

    } catch (e) {

      throw {err: {
          module: 'api/helpers/storage/account-create',
          message: sails.config.custom.ACCOUNTCREATE_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };
    }

  }


};

