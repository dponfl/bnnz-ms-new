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

      sails.log.warn('*** storage:accountUpdate, inputs.data: ', inputs.data);
      const accountRec = _.omit(inputs.data, ['service', 'room']);
      sails.log.warn('*** storage:accountUpdate, accountRec: ', accountRec);
      const serviceData = _.get(inputs.data, 'service');
      sails.log.warn('*** storage:accountUpdate, serviceData: ', serviceData);

      if (_.isNil(serviceData)) {

        return exits.success({
          status: 'ok',
          message: 'Account record was not updated: no service info',
          payload: {
            criteria: inputs.criteria,
            client: inputs.data
          },
        });

      }

      accountRec.service = serviceData.id;

      await Account.update(inputs.criteria).set(accountRec);

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
              message: _.truncate(e.message, {length: 320}) || 'no error message',
              stack: _.truncate(e.stack, {length: 320}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

  }


};

