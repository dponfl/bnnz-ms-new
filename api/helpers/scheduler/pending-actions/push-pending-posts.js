"use strict";

const sleep = require('util').promisify(setTimeout);
const moment = require('moment');

const moduleName = 'scheduler:pending-actions:push-pending-posts';


module.exports = {


  friendlyName: 'scheduler:pending-actions:push-pending-posts',


  description: 'scheduler:pending-actions:push-pending-posts',


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

    try {

      /**
       * Используем DB lock
       */

      const lockTimeOut = sails.config.custom.config.db.lockTimeOut || 600;

      const sqlGetLockPushPendingPosts = `
    SELECT GET_LOCK('pushPendingPostsLock', ${lockTimeOut}) as getPushPendingPostsLockResult
    `;

      const sqlReleaseLockPushPendingPosts = `
    SELECT RELEASE_LOCK('pushPendingPostsLock') as releasePushPendingPostsLockResult
    `;

      await sails.getDatastore('clientDb')
        .leaseConnection(async (db) => {

          try {

            const resGetLock = await sails
              .sendNativeQuery(sqlGetLockPushPendingPosts)
              .usingConnection(db);

            const getLockRes = _.get(resGetLock, 'rows[0].getPushPendingPostsLockResult', null);

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
             * Получаем список записей, которые нужно обработать
             */

            const limit = _.find(sails.config.custom.config.schedule.rules, {action: "pushPendingPosts"}).getRecordsLimit || 1000;

            const getPendingPostsParams = {
              criteria: {
                pendingActionName: sails.config.custom.enums.pendingActionsNames.GET_MEDIA_ID,
                checkInProgress: false,
                done: false,
                deleted: false,
              },
              limit,
            };

            const pendingPostsRaw = await sails.helpers.storage.pendingActionsGetJoi(getPendingPostsParams);

            if (pendingPostsRaw.status !== 'ok') {

              await LogProcessor.error({
                message: 'Wrong "pendingActionsGetJoi" response: status',
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.SCHEDULER_ERROR.name,
                location: moduleName,
                payload: {
                  getPendingPostsParams,
                  pendingPostsRaw,
                },
              });

              return exits.success({
                status: 'error',
                message: `${moduleName} performed`,
                payload: {},
              })

            }

            const pendingPosts = _.get(pendingPostsRaw, 'payload', null);

            if (pendingPosts == null) {

              await LogProcessor.error({
                message: 'Wrong "pendingActionsGetJoi" response: payload',
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.SCHEDULER_ERROR.name,
                location: moduleName,
                payload: {
                  getPendingPostsParams,
                  pendingPostsRaw,
                },
              });

              return exits.success({
                status: 'error',
                message: `${moduleName} performed`,
                payload: {},
              })

            }

            if (pendingPosts.length > 0) {

              // TODO: Delete after QA
              await LogProcessor.info({
                message: 'Найдены записи для отложенной проверки постов',
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.SCHEDULER_ERROR.name,
                location: moduleName,
                payload: {
                  pendingPosts,
                  limit,
                },
              });

              _.forEach(pendingPosts, async (pendingPost) => {

                // TODO: Delete after QA
                await LogProcessor.info({
                  message: 'запускаем процесс обработки поста',
                  // clientGuid,
                  // accountGuid,
                  // requestId: null,
                  // childRequestId: null,
                  errorName: sails.config.custom.SCHEDULER_ERROR.name,
                  location: moduleName,
                  payload: {
                    pendingPost
                  },
                });

                await processPendingPost(pendingPost);

              });

            }


            const ReleaseLock = await sails
              .sendNativeQuery(sqlReleaseLockPushPendingPosts)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releasePushPendingPostsLockResult', null);

            if (releaseLockRes == null) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                // clientGuid,
                // accountGuid,
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
                // clientGuid,
                // accountGuid,
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
              .sendNativeQuery(sqlReleaseLockPushPendingPosts)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releasePushPendingPostsLockResult', null);

            if (releaseLockRes == null) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                // clientGuid,
                // accountGuid,
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
                // clientGuid,
                // accountGuid,
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


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
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

async function processPendingPost(pendingPost) {

  let parserStatus = '';
  const parserRequestIntervals = sails.config.custom.config.parsers.inst.errorSteps.getMediaId.intervals;
  const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;

  let getMediaIdRaw = null;


  try {

    /**
     * Устанавливаем флаг, что запись взята в работу
     */

    pendingPost.actionsPerformed++;

    await sails.helpers.storage.pendingActionsUpdateJoi({
      criteria: {
        guid: pendingPost.guid,
      },
      data: {
        actionsPerformed: pendingPost.actionsPerformed,
        checkInProgress: true,
      }
    });


    const clientGetParams = {

      criteria: {
        guid: pendingPost.clientGuid,
      }

    };

    const clientsGetRaw = await sails.helpers.storage.clientGetByCriteriaJoi(clientGetParams);

    if (clientsGetRaw.status !== 'ok') {

      await LogProcessor.error({
        message: 'Wrong "clientGetByCriteriaJoi" response: status',
        // clientGuid,
        // accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          clientGetParams,
          clientsGetRaw,
        },
      });

      return exits.success({
        status: 'error',
        message: `${moduleName} performed`,
        payload: {},
      })

    }

    const clients = _.get(clientsGetRaw, 'payload', null);

    if (clients == null) {

      await LogProcessor.error({
        message: 'Wrong "clientGetByCriteriaJoi" response: payload',
        // clientGuid,
        // accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          clientGetParams,
          clientsGetRaw,
        },
      });

      return exits.success({
        status: 'error',
        message: `${moduleName} performed`,
        payload: {},
      })

    }

    if (clients.length > 1) {

      await LogProcessor.error({
        message: 'Wrong "clientGetByCriteriaJoi" response: more then one record found',
        // clientGuid,
        // accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          clientGetParams,
          clientsGetRaw,
        },
      });

      return exits.success({
        status: 'error',
        message: `${moduleName} performed`,
        payload: {},
      })

    }

    const client = clients[0];

    const postLink = _.get(pendingPost, 'payload.postLink', null);

    if (postLink == null) {
      await LogProcessor.error({
        message: 'Wrong pending post record content: no "payload.postLink"',
        // clientGuid,
        // accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          pendingPost,
        },
      });

      return exits.success({
        status: 'error',
        message: `${moduleName} performed`,
        payload: {},
      })
    }

    /**
     * Получаем mediaId поста
     */

    const activeParser = sails.config.custom.config.parsers.inst.activeParserName;

    const shortCode = _.get(pendingPost, 'payload.getMediaIdParams.shortCode', null);

    if (shortCode == null) {
      await LogProcessor.error({
        message: 'Wrong pending post record content: no "payload.getMediaIdParams.shortCode"',
        // clientGuid,
        // accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          pendingPost,
        },
      });

      return exits.success({
        status: 'error',
        message: `${moduleName} performed`,
        payload: {},
      })
    }

    const getMediaIdParams = {
      client,
      shortCode,
    };

    let i = 0;

    while (parserStatus !== 'success' && i < parserRequestIntervals.length) {

      getMediaIdRaw = await sails.helpers.parsers.inst[activeParser].getMediaIdJoi(getMediaIdParams);

      parserStatus = getMediaIdRaw.status;

      if (parserStatus !== 'success') {

        await sleep(parserRequestIntervals[i] * parserRequestIntervalTime);

      }

      i++;
    }

    if (parserStatus === 'success') {

      const mediaId = _.get(getMediaIdRaw, 'payload.mediaId', null);

      if (mediaId == null) {

        /**
         * пост не найден парсером:
         * обновляем запись - указываем, что пост не найден и переводим в выполненную задачу
         */

        await sails.helpers.storage.pendingActionsUpdateJoi({
          criteria: {
            guid: pendingPost.guid,
          },
          data: {
            checkInProgress: false,
            done: true,
            payloadResponse: {
              message: "post not found",
              shortCode,
              mediaId,
            }
          }
        });

        return true;

      } else {

        /**
         * пост найден парсером: начинаем генерацию задач
         */

        const generateTasksParams = {
          client,
          postLink,
          shortCode,
          mediaId,
        };

        const generateTasksResult = await sails.helpers.tasks.generateTasksJoi(generateTasksParams);

        if (generateTasksResult.status === 'ok') {

          await sails.helpers.storage.pendingActionsUpdateJoi({
            criteria: {
              guid: pendingPost.guid,
            },
            data: {
              checkInProgress: false,
              done: true,
              payloadResponse: {
                message: "tasks generated successfully",
                generateTasksParams: _.omit(generateTasksParams, 'client'),
                generateTasksResult,
              }
            }
          });

          return true;

        } else {

          await LogProcessor.critical({
            message: 'Wrong reply from sails.helpers.tasks.generateTasks',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            payload: {
              generateTasksParams: _.omit(generateTasksParams, 'client'),
              generateTasksResult
            },
          });

          await sails.helpers.storage.pendingActionsUpdateJoi({
            criteria: {
              guid: pendingPost.guid,
            },
            data: {
              checkInProgress: false,
              done: true,
              payloadResponse: {
                message: "tasks generation error",
                generateTasksParams: _.omit(generateTasksParams, 'client'),
                generateTasksResult,
              }
            }
          });

          return true;

        }

      }

    } else {

      /**
       * Корректный ответ от парсера так и НЕ БЫЛ ПОЛУЧЕН
       */

      /**
       * Обновляем запись для последующей обработки её шедуллером
       */

      // TODO: Delete after QA
      await LogProcessor.info({
        message: 'Корректный ответ от парсера так и НЕ БЫЛ ПОЛУЧЕН: Обновляем запись для последующей обработки её шедуллером',
        // clientGuid,
        // accountGuid,
        // requestId: null,
        // childRequestId: null,
        errorName: sails.config.custom.SCHEDULER_ERROR.name,
        location: moduleName,
        payload: {
          pendingPost,
        },
      });


      await sails.helpers.storage.pendingActionsUpdateJoi({
        criteria: {
          guid: pendingPost.guid,
        },
        data: {
          checkInProgress: false,
        }
      });

      return true;

    }

  } catch (e) {
    const throwError = false;
    if (throwError) {
      return await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
        throwError: true,
        errorPayloadAdditional: {
          pendingPost,
        }
      });
    } else {
      await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
        throwError: false,
        errorPayloadAdditional: {
          pendingPost,
        }
      });
      return exits.success({
        status: 'error',
        message: `${moduleName} performed`,
        payload: {},
      });
    }
  }

}


