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

      let account = await Account.create(inputs.account).fetch();

      account = await Account.findOne({guid: account.guid})
        .populate('room')
        .populate('service');

      sails.log.warn('<<<<<<< !!!!!!!!!!!! >>>>>>> account data object: ', account);

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
              message: e.message || 'no error message',
              stack: e.stack || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };
    }

  }


};

