"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:account-get-joi';

module.exports = {


  friendlyName: 'Account get',


  description: 'Get account record(s)',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
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

    const schema = Joi.object({
      clientId: Joi
        .number()
        .description('clientId')
        .integer()
        .positive(),
      accountIds: Joi
        .any()
        .description('Account ids array'),
      accountGuids: Joi
        .any()
        .description('Account guids array'),
      otherConditions: Joi
        .any()
        .description('Other search conditions'),
    }).or(
      'clientId',
      'accountIds',
      'accountGuids',
      'otherConditions',
    );

    let input;

    let searchConditions = {};

    try {

      input = await schema.validateAsync(inputs.params);

      if (_.has(input, 'accountIds') && input.accountIds.length > 0) {

        searchConditions['id'] =  input.accountIds;

      }

      if (_.has(input, 'accountGuids') && input.accountGuids.length > 0) {

        searchConditions['guid'] =  input.accountGuids;

      }

      if (_.has(input, 'clientId') && input.clientId) {

        searchConditions['client'] =  input.clientId;

      }

      if (!_.isNil(input.otherConditions)) {

        searchConditions = _.assignIn(searchConditions, input.otherConditions);

      }

      let account = await Account.find({where: searchConditions})
        .populate('service')
        .populate('next_service')
        .populate('room');

      return exits.success({
        status: 'ok',
        message: 'Account records',
        payload: account,
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}, error: ${sails.config.custom.ACCOUNTGETJOI_ERROR}`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }


};

