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

      // let account = await Account.find({where: searchConditions})
      //   .populate('service')
      //   .populate('next_service')
      //   .populate('room')
      //   .intercept((err) => {
      //     const errorData = {
      //       name: err.name || null,
      //       message: _.truncate(err.message, {
      //         length: 500,
      //         omission: ' [...]',
      //       }) || null,
      //       code: err.code || null,
      //       stack: _.truncate(err.stack, {
      //         length: 500,
      //         omission: ' [...]',
      //       })  || null,
      //     };
      //
      //     return new MyError(errorData);
      //   });

      // let account = await Account.find({where: searchConditions})
      //   .populate('service')
      //   .populate('next_service')
      //   .populate('room')
      //   .tolerate(async (err) => {
      //     await LogProcessor.critical({
      //       message: 'Some error message...',
      //       // clientGuid,
      //       // accountGuid,
      //       // requestId: null,
      //       // childRequestId: null,
      //       errorName: sails.config.custom.DB_ERROR.name,
      //       emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      //       location: moduleName,
      //       payload: {
      //         name: err.name || null,
      //         message: _.truncate(err.message, {
      //           length: 500,
      //           omission: ' [...]',
      //         }) || null,
      //         code: err.code || null,
      //         stack: _.truncate(err.stack, {
      //           length: 500,
      //           omission: ' [...]',
      //         })  || null,
      //       },
      //       createDbRecord: false,
      //     });
      //   });

      const findParams = {
        model: 'Account',
        params: searchConditions,
        populate: ['service', 'next_service', 'room'],
      };

      const accountFindRaw = await sails.helpers.dbProcessor.findJoi(findParams);

      let account = accountFindRaw.payload;

      return exits.success({
        status: 'ok',
        message: 'Account records',
        payload: account, // массив объектов записей аккаунта или пустой массив
      })

    } catch (e) {

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

function MyError(errorData) {
  this.message = errorData.message || null;
  this.payload = {
    name: errorData.name || null,
    message: errorData.message || null,
    code: errorData.code || null,
    stack: errorData.stack || null,
  }
}

// MyError.prototype = new Error();

