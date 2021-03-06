"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'storage:api-status-update-joi';


module.exports = {


  friendlyName: 'storage:api-status-update-joi',


  description: 'storage:api-status-update-joi',


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
      platformName: Joi
        .string()
        .description('platform name')
        .required(),
      moduleName: Joi
        .string()
        .description('module name')
        .required(),
      parserName: Joi
        .string()
        .description('parser name')
        .required(),
      data: Joi
        .any()
        .description('Data to save')
        .required(),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
    });

    let input;

    let apiStatusRec;

    let exitResultData;
    let performExit = false;

    try {

      input = await schema.validateAsync(inputs.params);

      /**
       * Используем DB lock
       */

      const lockTimeOut = sails.config.custom.config.db.lockTimeOut || 600;

      const sqlGetLockApiStatusUpdate = `
    SELECT GET_LOCK('apiStatusUpdateLock', ${lockTimeOut}) as getApiStatusUpdateLockResult
    `;

      const sqlReleaseLockApiStatusUpdate = `
    SELECT RELEASE_LOCK('apiStatusUpdateLock') as releaseApiStatusUpdateLockResult
    `;

      await sails.getDatastore('clientDb')
        .leaseConnection(async (db) => {

          try {

            const resGetLock = await sails
              .sendNativeQuery(sqlGetLockApiStatusUpdate)
              .usingConnection(db);

            const getLockRes = _.get(resGetLock, 'rows[0].getApiStatusUpdateLockResult', null);

            if (getLockRes == null) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                message: sails.config.custom.DB_ERROR_GET_LOCK_WRONG_RESPONSE.message,
                errorName: sails.config.custom.DB_ERROR_GET_LOCK_WRONG_RESPONSE.name,
                payload: {
                  resGetLock,
                },
              });
            }

            if (getLockRes === 0) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                message: sails.config.custom.DB_ERROR_GET_LOCK_DECLINE.message,
                errorName: sails.config.custom.DB_ERROR_GET_LOCK_DECLINE.name,
                payload: {
                  resGetLock,
                },
              });
            }

            /**
             * Начало блока целевых действий внутри лока
             */

            apiStatusRec = await ApiStatus.findOne({
              active: true,
            })
              .tolerate(async (err) => {

                err.details = {
                  active: true,
                };

                await LogProcessor.dbError({
                  error: err,
                  message: 'ApiStatus.findOne() error',
                  // clientGuid,
                  // accountGuid,
                  // requestId: null,
                  // childRequestId: null,
                  location: moduleName,
                  payload: {
                    searchCondition: {
                      active: true,
                    },
                  },
                });

                return null;
              });

            if (apiStatusRec == null) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.ERROR,
                location: moduleName,
                message: 'No ApiStatus record found',
                errorName: sails.config.custom.STORAGE_ERROR.name,
                payload: {
                  searchCondition: {
                    active: true,
                  },
                },
              });

            }


            const updateModule = _.get(apiStatusRec.data, `parsers.${input.platformName}.${input.moduleName}`, null);

            if (updateModule == null) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                message: `API status module for "parsers.${input.platformName}.${input.moduleName}" not found`,
                errorName: sails.config.custom.GENERAL_ERROR.name,
                payload: {
                  apiStatusRec,
                },
              });
            }

            const updateParser = _.find(updateModule, {parserName: input.parserName});

            if (updateParser == null) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                message: `API status block for parserName:"${input.parserName}" not found`,
                errorName: sails.config.custom.GENERAL_ERROR.name,
                payload: {
                  updateModule,
                },
              });
            }


            if (input.data.value !== updateParser[input.data.key]) {

              const old_value = {};
              const new_value = {};

              old_value[input.data.key] = updateParser[input.data.key];
              new_value[input.data.key] = input.data.value;

              const apiChanges = {
                platform: input.platformName,
                module: input.moduleName,
                parser: input.parserName,
                old_value,
                new_value,
                created_by: `${input.createdBy} => ${moduleName}`,
              };

              await ApiChanges.create(apiChanges)
                .tolerate(async (err) => {
                  err.details = {
                    apiChanges,
                  };

                  await LogProcessor.dbError({
                    error: err,
                    message: 'ApiChanges.create() error',
                    // clientGuid,
                    // accountGuid,
                    // requestId: null,
                    // childRequestId: null,
                    location: moduleName,
                    payload: {
                      apiChanges,
                    },
                  });

                  return true;
                });

              _.assign(updateParser, new_value);

              updateParser.updatedAt = moment().format();

              const apiStatusUpdateRes = await ApiStatus.update({
                id: apiStatusRec.id,
              }).set({data: apiStatusRec.data})
                .tolerate(async (err) => {

                  err.details = {
                    criteria: {
                      id: apiStatusRec.id,
                    },
                    data: apiStatusRec.data,
                  };

                  await LogProcessor.dbError({
                    error: err,
                    message: 'ApiStatus.update() error',
                    // clientGuid,
                    // accountGuid,
                    // requestId: null,
                    // childRequestId: null,
                    location: moduleName,
                    payload: {
                      criteria: {
                        id: apiStatusRec.id,
                      },
                      data: apiStatusRec.data,
                    },
                  });

                  return null;
                })
                .fetch();

              if (apiStatusUpdateRes == null) {

                performExit = true;
                exitResultData = {
                  status: 'error',
                  message: 'ApiStatus update error',
                  payload: {
                    input,
                    apiStatusRec,
                  },
                };

              } else {

                performExit = true;
                exitResultData = {
                  status: 'success',
                  message: 'ApiStatus updated & ApiChange record created',
                  payload: {
                    input,
                    apiStatusRec,
                  },
                };

              }

            }

            /**
             * Окончание блока целевых действий внутри лока
             */

            const ReleaseLock = await sails
              .sendNativeQuery(sqlReleaseLockApiStatusUpdate)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releaseApiStatusUpdateLockResult', null);

            if (releaseLockRes == null) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                payload: {
                  releaseLockRes,
                },
              });
            }

            if (releaseLockRes === 0) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.message,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                payload: {
                  releaseLockRes,
                },
              });
            }

            return;

          } catch (ee) {

            const ReleaseLock = await sails
              .sendNativeQuery(sqlReleaseLockApiStatusUpdate)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releaseApiStatusUpdateLockResult', null);

            if (releaseLockRes == null) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                payload: {
                  releaseLockRes,
                },
              });
            }

            if (releaseLockRes === 0) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.message,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                payload: {
                  releaseLockRes,
                },
              });
            }

            const throwError = true;
            if (throwError) {
              return await sails.helpers.general.catchErrorJoi({
                error: ee,
                location: moduleName,
                throwError: true,
              });
            } else {
              await sails.helpers.general.catchErrorJoi({
                error: ee,
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

        }); // .leaseConnection()

      if (performExit) {
        return exits.success(exitResultData);
      }

      return exits.success({
        status: 'success',
        message: 'ApiChange: nothing to change',
        payload: {
          input,
          apiStatusRec,
        },
      })

    } catch (e) {
      const throwError = false;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            input,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            input,
          },
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} performed`,
          payload: {
            input,
          },
        });
      }
    }

  }

};

