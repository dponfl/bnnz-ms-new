"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:account-update-joi';

module.exports = {


  friendlyName: 'Account update',


  description: 'Update record for the existing account',


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
      criteria: Joi
                .any()
                .required()
                .description('Criteria to update only one account record'),
      data: Joi
            .any()
            .required()
            .description('Data to update to the account record'),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const accountRec = _.omit(input.data, ['service', 'room']);
      const serviceData = _.get(input.data, 'service', null);

      if (serviceData != null) {
        accountRec.service = serviceData.id;
      }

      const accountRecord = await Account.findOne({
        where: input.criteria,
      })
        .tolerate(async (err) => {

          err.details = {
            where: input.criteria,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Account.findOne() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              where: input.criteria,
            },
          });

          return null;
        });

      if (accountRecord != null) {
        await sails.helpers.storage.accountFieldsPutJoi({
          accountGuid: accountRecord.guid,
          data: accountRec,
          createdBy: `${input.createdBy} => ${moduleName}`,
        })
      }

      await Account.update(input.criteria).set(accountRec)
        .tolerate(async (err) => {

          err.details = {
            criteria: input.criteria,
            data: accountRec,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Account.update() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              criteria: input.criteria,
              data: accountRec,
            },
          });

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Account.update() error',
            // clientGuid,
            // accountGuid,
            errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
            payload: {
              criteria: input.criteria,
              data: accountRec,
            },
          });

          return true;
        });

      return exits.success({
        status: 'ok',
        message: 'Account record updated',
        payload: {
          criteria: input.criteria,
          data: input.data
        },
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
      //     payload: {
      //       error: e,
      //     },
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

