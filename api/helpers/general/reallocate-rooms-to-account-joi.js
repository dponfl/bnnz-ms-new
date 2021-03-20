"use strict";

const _ = require('lodash');

const Joi = require('@hapi/joi');

const moduleName = 'general:reallocate-rooms-to-account-joi';

module.exports = {


  friendlyName: 'Re-allocate rooms to the specific account',


  description: 'Re-allocate rooms to the specific account',


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

    /**
     * Для указанного аккаунта:
     *    - удаляет связь аккаунта с комнатами
     *    - освобождает комнату от этого аккаунта
     *    - получает новые комнаты для размещения аккаунта
     *    - устанавливает новые связи аккаунта с новыми комнатами
     */

    const schema = Joi.object({
      account: Joi
        .any()
        .description('account record')
        .required(),
      previousServiceName: Joi
        .string()
        .description('previous service level name')
        .default(null),
    });

    let input;

    let accountGuid;

    let resultRooms;

    let useServiceName;

    try {

      input = await schema.validateAsync(inputs.params);

      accountGuid = input.account.guid;

      if (input.previousServiceName != null) {
        useServiceName= input.previousServiceName;
      } else {
        useServiceName = input.account.service.name;
      }

      const accountCategory = sails.config.custom.config.rooms.category_by_service[useServiceName];

      if (accountCategory == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Unknown account category',
          // clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            accountServiceName: input.account.service.name,
          },
        });
      }

      const lockTimeOut = sails.config.custom.config.db.lockTimeOut || 600;

      const sqlGetLockReallocateRoomsToAccount = `
    SELECT GET_LOCK('reallocateRoomsLock', ${lockTimeOut}) as getReallocateRoomsLockResult
    `;

      const sqlReleaseLockReallocateRoomsToAccount = `
    SELECT RELEASE_LOCK('reallocateRoomsLock') as releaseReallocateRoomsLockResult
    `;

      resultRooms = await sails.getDatastore('clientDb')
        .leaseConnection(async (db) => {

          try {

            const resGetLock = await sails
              .sendNativeQuery(sqlGetLockReallocateRoomsToAccount)
              .usingConnection(db);

            const getLockRes = _.get(resGetLock, 'rows[0].getReallocateRoomsLockResult', null);

            if (getLockRes == null) {
              await sails.helpers.general.throwErrorJoi({
                accountGuid,
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: `${moduleName}:${methodName}`,
                message: sails.config.custom.DB_ERROR_GET_LOCK_WRONG_RESPONSE.message,
                errorName: sails.config.custom.DB_ERROR_GET_LOCK_WRONG_RESPONSE.name,
                payload: {
                  resGetLock,
                },
              });
            }

            if (getLockRes === 0) {
              await sails.helpers.general.throwErrorJoi({
                accountGuid,
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: `${moduleName}:${methodName}`,
                message: sails.config.custom.DB_ERROR_GET_LOCK_DECLINE.message,
                errorName: sails.config.custom.DB_ERROR_GET_LOCK_DECLINE.name,
                payload: {
                  resGetLock,
                },
              });
            }


            // _.forEach(input.account.room, async function (elem) {
            //   let room = await Room.findOne({id: elem.id})
            //     .usingConnection(db)
            //     .tolerate(async (err) => {
            //
            //       err.details = {
            //         id: elem.id,
            //       };
            //
            //       await LogProcessor.dbError({
            //         error: err,
            //         message: 'Room.findOne() error',
            //         // clientGuid,
            //         accountGuid,
            //         // requestId: null,
            //         // childRequestId: null,
            //         location: moduleName,
            //         payload: {
            //           id: elem.id,
            //         },
            //       });
            //
            //       return null;
            //     });
            //
            //   if (room) {
            //     await Account.removeFromCollection(input.account.id, 'room', room.id)
            //       .usingConnection(db)
            //       .tolerate(async (err) => {
            //
            //         err.details = {
            //           inputAccountId: input.account.id,
            //           model: 'room',
            //           roomId: room.id,
            //         };
            //
            //         await LogProcessor.dbError({
            //           error: err,
            //           message: 'Account.removeFromCollection() error',
            //           // clientGuid,
            //           accountGuid,
            //           // requestId: null,
            //           // childRequestId: null,
            //           location: moduleName,
            //           payload: {
            //             inputAccountId: input.account.id,
            //             model: 'room',
            //             roomId: room.id,
            //           },
            //         });
            //
            //         return true;
            //       });
            //
            //     switch (accountCategory) {
            //       case 'bronze':
            //         await Room.updateOne({id: room.id})
            //           .set({
            //             bronze: room.bronze - 1,
            //             accounts_number: room.accounts_number - 1
            //           })
            //           .usingConnection(db)
            //           .tolerate(async (err) => {
            //
            //             err.details = {
            //               criteria: {
            //                 id: room.id,
            //               },
            //               data: {
            //                 bronze: room.bronze - 1,
            //                 accounts_number: room.accounts_number - 1
            //               }
            //             };
            //
            //             await LogProcessor.dbError({
            //               error: err,
            //               message: 'Room.updateOne() error',
            //               // clientGuid,
            //               accountGuid,
            //               // requestId: null,
            //               // childRequestId: null,
            //               location: moduleName,
            //               payload: {
            //                 criteria: {
            //                   id: room.id,
            //                 },
            //                 data: {
            //                   bronze: room.bronze - 1,
            //                   accounts_number: room.accounts_number - 1
            //                 }
            //               },
            //             });
            //
            //             return true;
            //           });
            //
            //         break;
            //
            //       case 'gold':
            //         await Room.updateOne({id: room.id})
            //           .set({
            //             gold: room.gold - 1,
            //             accounts_number: room.accounts_number - 1
            //           })
            //           .usingConnection(db)
            //           .tolerate(async (err) => {
            //
            //             err.details = {
            //               criteria: {
            //                 id: room.id,
            //               },
            //               data: {
            //                 gold: room.gold - 1,
            //                 accounts_number: room.accounts_number - 1
            //               }
            //             };
            //
            //             await LogProcessor.dbError({
            //               error: err,
            //               message: 'Room.updateOne() error',
            //               // clientGuid,
            //               accountGuid,
            //               // requestId: null,
            //               // childRequestId: null,
            //               location: moduleName,
            //               payload: {
            //                 criteria: {
            //                   id: room.id,
            //                 },
            //                 data: {
            //                   gold: room.gold - 1,
            //                   accounts_number: room.accounts_number - 1
            //                 }
            //               },
            //             });
            //
            //             return true;
            //           });
            //
            //
            //         break;
            //
            //       case 'platinum':
            //         await Room.updateOne({id: room.id})
            //           .set({
            //             platinum: room.platinum - 1,
            //             accounts_number: room.accounts_number - 1
            //           })
            //           .usingConnection(db)
            //           .tolerate(async (err) => {
            //
            //             err.details = {
            //               criteria: {
            //                 id: room.id,
            //               },
            //               data: {
            //                 platinum: room.platinum - 1,
            //                 accounts_number: room.accounts_number - 1
            //               }
            //             };
            //
            //             await LogProcessor.dbError({
            //               error: err,
            //               message: 'Room.updateOne() error',
            //               // clientGuid,
            //               accountGuid,
            //               // requestId: null,
            //               // childRequestId: null,
            //               location: moduleName,
            //               payload: {
            //                 criteria: {
            //                   id: room.id,
            //                 },
            //                 data: {
            //                   platinum: room.platinum - 1,
            //                   accounts_number: room.accounts_number - 1
            //                 }
            //               },
            //             });
            //
            //             return true;
            //           });
            //
            //
            //         break;
            //
            //       case 'star':
            //         await Room.updateOne({id: room.id})
            //           .set({
            //             star: room.star - 1,
            //             accounts_number: room.accounts_number - 1
            //           })
            //           .usingConnection(db)
            //           .tolerate(async (err) => {
            //
            //             err.details = {
            //               criteria: {
            //                 id: room.id,
            //               },
            //               data: {
            //                 star: room.star - 1,
            //                 accounts_number: room.accounts_number - 1
            //               }
            //             };
            //
            //             await LogProcessor.dbError({
            //               error: err,
            //               message: 'Room.updateOne() error',
            //               // clientGuid,
            //               accountGuid,
            //               // requestId: null,
            //               // childRequestId: null,
            //               location: moduleName,
            //               payload: {
            //                 criteria: {
            //                   id: room.id,
            //                 },
            //                 data: {
            //                   star: room.star - 1,
            //                   accounts_number: room.accounts_number - 1
            //                 }
            //               },
            //             });
            //
            //             return true;
            //           });
            //
            //
            //         break;
            //
            //       default:
            //         // throw new Error(`${moduleName}, error: Unknown client category="${accountCategory}"`);
            //         await sails.helpers.general.throwErrorJoi({
            //           errorType: sails.config.custom.enums.errorType.ERROR,
            //           location: moduleName,
            //           message: 'Unknown client category',
            //           // clientGuid,
            //           accountGuid,
            //           errorName: sails.config.custom.GENERAL_ERROR.name,
            //           payload: {
            //             accountCategory,
            //           },
            //         });
            //
            //     }
            //
            //   }
            // });

            for (const elem of input.account.room) {
              let room = await Room.findOne({id: elem.id})
                .usingConnection(db)
                .tolerate(async (err) => {

                  err.details = {
                    id: elem.id,
                  };

                  await LogProcessor.dbError({
                    error: err,
                    message: 'Room.findOne() error',
                    // clientGuid,
                    accountGuid,
                    // requestId: null,
                    // childRequestId: null,
                    location: moduleName,
                    payload: {
                      id: elem.id,
                    },
                  });

                  return null;
                });

              if (room) {
                await Account.removeFromCollection(input.account.id, 'room', room.id)
                  .usingConnection(db)
                  .tolerate(async (err) => {

                    err.details = {
                      inputAccountId: input.account.id,
                      model: 'room',
                      roomId: room.id,
                    };

                    await LogProcessor.dbError({
                      error: err,
                      message: 'Account.removeFromCollection() error',
                      // clientGuid,
                      accountGuid,
                      // requestId: null,
                      // childRequestId: null,
                      location: moduleName,
                      payload: {
                        inputAccountId: input.account.id,
                        model: 'room',
                        roomId: room.id,
                      },
                    });

                    return true;
                  });

                switch (accountCategory) {
                  case 'bronze':
                    await Room.updateOne({id: room.id})
                      .set({
                        bronze: room.bronze - 1,
                        accounts_number: room.accounts_number - 1
                      })
                      .usingConnection(db)
                      .tolerate(async (err) => {

                        err.details = {
                          criteria: {
                            id: room.id,
                          },
                          data: {
                            bronze: room.bronze - 1,
                            accounts_number: room.accounts_number - 1
                          }
                        };

                        await LogProcessor.dbError({
                          error: err,
                          message: 'Room.updateOne() error',
                          // clientGuid,
                          accountGuid,
                          // requestId: null,
                          // childRequestId: null,
                          location: moduleName,
                          payload: {
                            criteria: {
                              id: room.id,
                            },
                            data: {
                              bronze: room.bronze - 1,
                              accounts_number: room.accounts_number - 1
                            }
                          },
                        });

                        return true;
                      });

                    break;

                  case 'gold':
                    await Room.updateOne({id: room.id})
                      .set({
                        gold: room.gold - 1,
                        accounts_number: room.accounts_number - 1
                      })
                      .usingConnection(db)
                      .tolerate(async (err) => {

                        err.details = {
                          criteria: {
                            id: room.id,
                          },
                          data: {
                            gold: room.gold - 1,
                            accounts_number: room.accounts_number - 1
                          }
                        };

                        await LogProcessor.dbError({
                          error: err,
                          message: 'Room.updateOne() error',
                          // clientGuid,
                          accountGuid,
                          // requestId: null,
                          // childRequestId: null,
                          location: moduleName,
                          payload: {
                            criteria: {
                              id: room.id,
                            },
                            data: {
                              gold: room.gold - 1,
                              accounts_number: room.accounts_number - 1
                            }
                          },
                        });

                        return true;
                      });


                    break;

                  case 'platinum':
                    await Room.updateOne({id: room.id})
                      .set({
                        platinum: room.platinum - 1,
                        accounts_number: room.accounts_number - 1
                      })
                      .usingConnection(db)
                      .tolerate(async (err) => {

                        err.details = {
                          criteria: {
                            id: room.id,
                          },
                          data: {
                            platinum: room.platinum - 1,
                            accounts_number: room.accounts_number - 1
                          }
                        };

                        await LogProcessor.dbError({
                          error: err,
                          message: 'Room.updateOne() error',
                          // clientGuid,
                          accountGuid,
                          // requestId: null,
                          // childRequestId: null,
                          location: moduleName,
                          payload: {
                            criteria: {
                              id: room.id,
                            },
                            data: {
                              platinum: room.platinum - 1,
                              accounts_number: room.accounts_number - 1
                            }
                          },
                        });

                        return true;
                      });


                    break;

                  case 'star':
                    await Room.updateOne({id: room.id})
                      .set({
                        star: room.star - 1,
                        accounts_number: room.accounts_number - 1
                      })
                      .usingConnection(db)
                      .tolerate(async (err) => {

                        err.details = {
                          criteria: {
                            id: room.id,
                          },
                          data: {
                            star: room.star - 1,
                            accounts_number: room.accounts_number - 1
                          }
                        };

                        await LogProcessor.dbError({
                          error: err,
                          message: 'Room.updateOne() error',
                          // clientGuid,
                          accountGuid,
                          // requestId: null,
                          // childRequestId: null,
                          location: moduleName,
                          payload: {
                            criteria: {
                              id: room.id,
                            },
                            data: {
                              star: room.star - 1,
                              accounts_number: room.accounts_number - 1
                            }
                          },
                        });

                        return true;
                      });


                    break;

                  default:
                    // throw new Error(`${moduleName}, error: Unknown client category="${accountCategory}"`);
                    await sails.helpers.general.throwErrorJoi({
                      errorType: sails.config.custom.enums.errorType.ERROR,
                      location: moduleName,
                      message: 'Unknown client category',
                      // clientGuid,
                      accountGuid,
                      errorName: sails.config.custom.GENERAL_ERROR.name,
                      payload: {
                        accountCategory,
                      },
                    });

                }

              }
            }

            const rooms = await sails.helpers.general.allocateRoomsJoi({
              accountGuid,
            });

            const ReleaseLock = await sails
              .sendNativeQuery(sqlReleaseLockReallocateRoomsToAccount)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releaseReallocateRoomsLockResult', null);

            if (releaseLockRes == null) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                // clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: `${moduleName}:${methodName}`,
                payload: {
                  releaseLockRes,
                },
              });
            }

            if (releaseLockRes === 0) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.message,
                // clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: `${moduleName}:${methodName}`,
                payload: {
                  releaseLockRes,
                },
              });
            }

            return rooms;

          } catch (ee) {

            const ReleaseLock = await sails
              .sendNativeQuery(sqlReleaseLockReallocateRoomsToAccount)
              .usingConnection(db);

            const releaseLockRes = _.get(ReleaseLock, 'rows[0].releaseReallocateRoomsLockResult', null);

            if (releaseLockRes == null) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
                // clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: `${moduleName}:${methodName}`,
                payload: {
                  releaseLockRes,
                },
              });
            }

            if (releaseLockRes === 0) {
              await LogProcessor.critical({
                message: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.message,
                // clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.DB_ERROR_RELEASE_LOCK_DECLINE.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
                location: `${moduleName}:${methodName}`,
                payload: {
                  releaseLockRes,
                },
              });
            }


            const throwError = true;
            if (throwError) {
              return await sails.helpers.general.catchErrorJoi({
                accountGuid,
                error: ee,
                location: `${moduleName}:${methodName}`,
                throwError: true,
              });
            } else {
              await sails.helpers.general.catchErrorJoi({
                accountGuid,
                error: ee,
                location: `${moduleName}:${methodName}`,
                throwError: false,
              });
              return exits.success({
                status: 'ok',
                message: `${moduleName}:${methodName} performed`,
                payload: {},
              });
            }
          }

        }); // leaseConnection()


      return exits.success({
        status: 'ok',
        message: 'Rooms re-allocated to the account',
        payload: {rooms: resultRooms}
      });

    } catch (e) {
      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          accountGuid,
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          accountGuid,
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        });
      }
    }
  }
};

