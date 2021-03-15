"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:client-update-joi';


module.exports = {


  friendlyName: 'Client update',


  description: 'Update record for the existing client',


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
        .description('Criteria to update client record')
        .required(),
      data: Joi
        .any()
        .description('Data to update to the client record')
        .required(),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
      makeClientFieldsRecord: Joi
        .boolean()
        .default(true),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const accounts = _.get(input.data, 'accounts');

      _.forEach(accounts, async (acc) => {

        await sails.helpers.storage.accountUpdateJoi({
          criteria: {id: acc.id},
          data: acc,
          createdBy: `${input.createdBy} => ${moduleName}`,
        })
      });

      const clientRec = await Client.findOne({
        where: input.criteria,
      })
        .tolerate(async (err) => {

          err.details = {
            where: input.criteria,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Client.findOne() error',
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

      if (clientRec != null && input.makeClientFieldsRecord) {
        await sails.helpers.storage.clientFieldsPut.with({
          clientGuid: clientRec.guid,
          data: input.data,
          createdBy: `${input.createdBy} => ${moduleName}`,
        })
      }

      await Client.update(input.criteria).set(_.omit(input.data, 'accounts'))
        .tolerate(async (err) => {

          err.details = {
            criteria: _.omit(input.data, 'accounts'),
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Client.update() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              criteria: _.omit(input.data, 'accounts'),
            },
          });

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Client.update() error',
            // clientGuid,
            // accountGuid,
            errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
            payload: {
              criteria: _.omit(input.data, 'accounts'),
            },
          });

          return true;
        });

      return exits.success({
        status: 'ok',
        message: 'Client updated',
        payload: {
          criteria: input.criteria,
          client: input.data
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

