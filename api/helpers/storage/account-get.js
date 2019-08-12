module.exports = {


  friendlyName: 'Account get',


  description: 'Get account record(s)',


  inputs: {

    clientId: {
      friendlyName: 'clientId',
      description: 'clientId',
      type: 'string',
    },

    accountIds: {
      friendlyName: 'account ids',
      description: 'Account ids array',
      type: 'ref',
    },

    accountGuids: {
      friendlyName: 'account guids',
      description: 'Account guids array',
      type: 'ref',
    },

    otherConditions: {
      friendlyName: 'Other search conditions',
      description: 'Other search conditions',
      type: 'ref',
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

    let searchConditions = {};

    try {

      /**
       * Either accounts array or clientId to be specified
       */

      if (_.isNil(inputs.clientId)
        && _.isNil(inputs.accountIds)
        && _.isNil(inputs.accountGuids)
        && _.isNil(inputs.otherConditions)
      ) {

        throw new Error(`Neither accounts nor clientId nor other search conditions provided, inputs: ${inputs}`);

      }

      if (_.has(inputs, 'accountIds') && inputs.accountIds.length > 0) {

        searchConditions['id'] =  inputs.accountIds;

      }

      if (_.has(inputs, 'accountGuids') && inputs.accountGuids.length > 0) {

        searchConditions['guid'] =  inputs.accountGuids;

      }

      if (_.has(inputs, 'clientId') && inputs.clientId) {

        searchConditions['client'] =  inputs.clientId;

      }

      if (!_.isNil(inputs.otherConditions)) {

        searchConditions = _.assignIn(searchConditions, inputs.otherConditions);

      }

      let account = await Account.find({where: searchConditions})
        .populate('service')
        .populate('room');

      // sails.log.warn('<<<<<<< !!!!!!!!!!!! >>>>>>> account data object: ', account);

      return exits.success({
        status: 'ok',
        message: 'Account records',
        payload: account,
      })

    } catch (e) {

      throw {err: {
          module: 'api/helpers/storage/account-get',
          message: sails.config.custom.ACCOUNTGET_ERROR,
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

