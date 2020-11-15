"use strict";

const sleep = require('util').promisify(setTimeout);

const moduleName = 'scheduler:api-monitoring:api-status-refresh';


module.exports = {


  friendlyName: 'scheduler:api-monitoring:api-status-refresh',


  description: 'scheduler:api-monitoring:api-status-refresh',


  inputs: {
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

    let platformName;

    const client = {
      guid: 'd5c38def-2c56-4fdc-be35-2157fd8589d6',
      account_use: '88f93f36-99a0-46d6-b54f-f6279115784b',
    };

    try {

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

      await sails.getDatastore('configDb')
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

            const apiStatusRec = await ApiStatus.findOne({
              active: true,
            })
              .usingConnection(db)
              .tolerate(async (err) => {

                err.details = {
                  active: true,
                };

                await LogProcessor.dbError({
                  error: err,
                  message: 'ApiStatus.findOne() error',
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

            /**
             * Проверка статусов парсеров для Inst
             */

            platformName = 'instagram';

            const modules = _.get(apiStatusRec.data, `parsers.${platformName}`, null);

            if (modules == null) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: moduleName,
                message: `API status section for "parsers.${platformName}" not found`,
                errorName: sails.config.custom.GENERAL_ERROR.name,
                payload: {
                  apiStatusRec,
                },
              });
            }

            for (const module in modules) {

              for (const parser of modules[module]) {

                if (_.get(parser, 'enabled', false)
                  && !_.get(parser, 'active', true)
                ) {

                  /**
                   * Выполняем проверку работоспособности парсера на тестовых данных
                   */

                  await checkInstParser(client, platformName, module, parser);

                  // TODO: Убрать после того, как лимит на 1 запрос в сек будет убран для logicbuilder
                  await sleep(1000);

                }

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
                throwError,
              });
            } else {
              await sails.helpers.general.catchErrorJoi({
                error: ee,
                location: moduleName,
                throwError,
              });
              return exits.success({
                status: 'ok',
                message: `${moduleName} performed`,
                payload: {},
              });
            }

          }

        }); // .leaseConnection()

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const throwError = false;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError,
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

async function checkInstParser(client, platform, module, parser) {

  const methodName = 'checkInstParser';

  const testData = {
    checkProfileExists: {
      instProfile: 'webstudiopro'
    },
    checkProfileSubscription: {
      checkProfile: 'webstudiopro',
      profileId: '7210053297',
      profilesList: ['befame.ru'],
    },
    checkLikes: {
      instProfile: 'dmitrysnap',
      shortCode: 'Bf3antMFqwr',
      postMediaId: '1726966059909950507',
    },
    checkComments: {
      instProfile: 'dmitrysnap',
      shortCode: 'Bf3antMFqwr',
      postMediaId: '1726966059909950507',
    },
    getPostMetadata: {
      shortCode: 'Bf3antMFqwr',
    }
  };


  switch (module) {
    case 'checkProfileExists':

      const checkProfileExistsParams = {
        client,
        instProfile: testData[module].instProfile,
      };

      const checkProfileExistsRaw = await sails.helpers.parsers.inst[parser.parserName].checkProfileExistsJoi(checkProfileExistsParams);

      if (checkProfileExistsRaw.status === 'success') {
        await activateParser(platform, module, parser, `${moduleName}=>${methodName}`);
      }

      break;

    case 'checkProfileSubscription':

      const checkProfileSubscriptionParams = {
        client,
        checkProfile: testData[module].checkProfile,
        profileId: testData[module].profileId,
        profilesList: testData[module].profilesList,
      };

      const checkProfileSubscriptionResRaw = await sails.helpers.parsers.inst[parser.parserName].checkProfileSubscriptionJoi(checkProfileSubscriptionParams);

      if (checkProfileSubscriptionResRaw.status === 'success') {
        await activateParser(platform, module, parser, `${moduleName}=>${methodName}`);
      }

      break;

    case 'checkLikes':

      const checkLikesParams = {
        client,
        instProfile: testData[module].instProfile,
        shortCode: testData[module].shortCode,
        postMediaId: testData[module].postMediaId,
      };

      const checkLikesJoiRaw = await sails.helpers.parsers.inst[parser.parserName].checkLikesJoi(checkLikesParams);

      if (checkLikesJoiRaw.status === 'success') {
        await activateParser(platform, module, parser, `${moduleName}=>${methodName}`);
      }

      break;

    case 'checkComments':

      const checkCommentsParams = {
        client,
        instProfile: testData[module].instProfile,
        shortCode: testData[module].shortCode,
        postMediaId: testData[module].postMediaId,
      };

      const checkCommentsJoiRaw = await sails.helpers.parsers.inst[parser.parserName].checkCommentsJoi(checkCommentsParams);

      if (checkCommentsJoiRaw.status === 'success') {
        await activateParser(platform, module, parser, `${moduleName}=>${methodName}`);
      }

      break;

    case 'getPostMetadata':

      const getPostMetadataParams = {
        client,
        shortCode: testData[module].shortCode,
      };

      const getPostMetadataJoiRaw = await sails.helpers.parsers.inst[parser.parserName].getPostMetadataJoi(getPostMetadataParams);

      if (getPostMetadataJoiRaw.status === 'success') {
        await activateParser(platform, module, parser, `${moduleName}=>${methodName}`);
      }

      break;

    default:
      await LogProcessor.critical({
        message: 'Unknown module name',
        // requestId: null,
        // childRequestId: null,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
        location: moduleName,
        payload: {
          module,
        },
      });
  }

}

async function activateParser(platform, module, parser, createdBy) {

  const methodName = 'activateParser';

  const apiStatusUpdateParams = {
    platformName: platform,
    moduleName: module,
    parserName: parser.parserName,
    data: {
      key: 'active',
      value: true,
    },
    createdBy: `${createdBy}=>${methodName}`,
  };

  await sails.helpers.storage.apiStatusUpdateJoi(apiStatusUpdateParams);


}

