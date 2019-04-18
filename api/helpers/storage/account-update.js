module.exports = {


  friendlyName: 'Account update',


  description: 'Update record for the existing account',


  inputs: {

    criteria: {
      friendlyName: 'criteria',
      description: 'Criteria to update account record',
      type: 'ref',
      required: true,
    },

    data: {
      friendlyName: 'data',
      description: 'Data to update to the account record',
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

      await Account.update(inputs.criteria).set(inputs.data);

      return exits.success({
        status: 'ok',
        message: 'Account record updated',
        payload: {
          criteria: inputs.criteria,
          client: inputs.data
        },
      })

    } catch (e) {

      throw {err: {
          module: 'api/helpers/storage/account-update',
          message: sails.config.custom.ACCOUNTUPDATE_ERROR,
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

