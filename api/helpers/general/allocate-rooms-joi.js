"use strict";

const _ = require('lodash');

const Joi = require('@hapi/joi');

const moduleName = 'general:allocate-rooms-joi';

module.exports = {


  friendlyName: 'Find or create a new rooms and allocates them to the account',


  description: 'Find or create a new rooms and allocates them to the account',


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
     * Находит/создаёт количество комнат в соответствии с уровнем сервиса аккаунта
     * (соответственно увеличивая счётчики аккаунтов в них) и связывает их с аккаунтом
     * Возвращает:
     *  - массив объектов комнат
     *  - массив ID этих комнат
     */

    const schema = Joi.object({
      accountGuid: Joi
        .string()
        .description('account guid')
        .guid()
        .required(),
    });

    let input;

    let roomRecordWeGet;
    let roomResultArray = [];
    let roomResultIDsArray = [];
    let usedRooms = [];

    try {

      input = await schema.validateAsync(inputs.params);

      const accountRaw = await sails.helpers.storage.accountGetJoi({
        accountGuids: [input.accountGuid],
      });

      if (accountRaw.status !== 'ok') {
        // throw new Error(`${moduleName}, error: Unknown accountGuid="${input.accountGuid}"`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Unknown accountGuid',
          accountGuid: input.accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            accountGuid: input.accountGuid,
          },
        });

      }

      const account = accountRaw.payload[0] || null;

      if (account == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No accounts found',
          accountGuid: input.accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            accountRaw,
          },
        });
      }

      if (account.service == null) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No service info for account',
          accountGuid: input.accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            account,
          },
        });
      }

      const roomsNum = account.service.rooms;

      for (let i=0; i < roomsNum; i++) {
        roomRecordWeGet = await allocateOneRoom(usedRooms, account);
        usedRooms.push(roomRecordWeGet);
        roomResultArray.push(roomRecordWeGet);
        roomResultIDsArray.push(roomRecordWeGet.id);
      }

      return exits.success({
        status: 'ok',
        message: 'Rooms allocated',
        payload: {
          roomRes: roomResultArray,
          roomIDsRes: roomResultIDsArray,
        }
      });

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

async function allocateOneRoom(doNotUseRooms, accountRec) {

  const methodName = 'allocateOneRoom';

  /**
   * Возвращает елемент таблицы Room в который может размещаться клиент
   * (счётчик клиентов соответственно увеличивается)
   */

  let totalRooms = 0; // counter of how many rooms exists before new allocation
  let checkedRooms = []; // we mark room by used=true if this room was
  // already allocated for this client (e.g. the room is in "doNotUseRooms" array)
  let filteredRooms = []; // keep list of rooms not allocated to the client yet
  let roomRec;
  let resultRoomRec;
  let rooms;

  const lockTimeOut = sails.config.custom.config.db.lockTimeOut || 600;

  const sqlGetLockAllocateRoom = `
    SELECT GET_LOCK('allocateRoomLock', ${lockTimeOut}) as getAllocateRoomLockResult
    `;

  const sqlReleaseLockAllocateRoom = `
    SELECT RELEASE_LOCK('allocateRoomLock') as releaseAllocateRoomLockResult
    `;


  try {

    resultRoomRec = await sails.getDatastore('clientDb')
      .leaseConnection(async (db) => {

        try {

          const resGetLock = await sails
            .sendNativeQuery(sqlGetLockAllocateRoom)
            .usingConnection(db);

          const getLockRes = _.get(resGetLock, 'rows[0].getAllocateRoomLockResult', null);

          if (getLockRes == null) {
            await sails.helpers.general.throwErrorJoi({
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

          const accountCategory = sails.config.custom.config.rooms.category_by_service[accountRec.service.name];

          switch (accountCategory) {
            case 'bronze':

              rooms = await Room.find({
                where: {
                  active: true
                },
              })
                .usingConnection(db)
                .tolerate(async (err) => {

                  err.details = {
                    where: {
                      active: true
                    },
                  };

                  await LogProcessor.dbError({
                    error: err,
                    message: 'Room.find() error',
                    // clientGuid,
                    // accountGuid,
                    // requestId: null,
                    // childRequestId: null,
                    location: `${moduleName}:${methodName}`,
                    payload: {
                      where: {
                        active: true
                      },
                    },
                  });

                  return 'error';
                });

              if (rooms === 'error') {
                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                  location: `${moduleName}:${methodName}`,
                  message: 'Room.count() error',
                  // clientGuid,
                  // accountGuid,
                  errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                  payload: {
                    where: {
                      active: true
                    },
                  },
                });
              }

              break;

            case 'gold':

              rooms = await Room.find({
                where: {
                  active: true,
                  gold: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.gold}
                },
              })
                .usingConnection(db)
                .tolerate(async (err) => {

                  err.details = {
                    where: {
                      active: true,
                      gold: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.gold}
                    },
                  };

                  await LogProcessor.dbError({
                    error: err,
                    message: 'Room.find() error',
                    // clientGuid,
                    // accountGuid,
                    // requestId: null,
                    // childRequestId: null,
                    location: `${moduleName}:${methodName}`,
                    payload: {
                      where: {
                        active: true,
                        gold: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.gold}
                      },
                    },
                  });

                  return 'error';
                });

              if (rooms === 'error') {
                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                  location: `${moduleName}:${methodName}`,
                  message: 'Room.count() error',
                  // clientGuid,
                  // accountGuid,
                  errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                  payload: {
                    where: {
                      active: true,
                      gold: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.gold}
                    },
                  },
                });
              }

              break;

            case 'platinum':

              rooms = await Room.find({
                where: {
                  active: true,
                  platinum: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.platinum}
                },
              })
                .usingConnection(db)
                .tolerate(async (err) => {

                  err.details = {
                    where: {
                      active: true,
                      platinum: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.platinum}
                    },
                  };

                  await LogProcessor.dbError({
                    error: err,
                    message: 'Room.find() error',
                    // clientGuid,
                    // accountGuid,
                    // requestId: null,
                    // childRequestId: null,
                    location: `${moduleName}:${methodName}`,
                    payload: {
                      where: {
                        active: true,
                        platinum: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.platinum}
                      },
                    },
                  });

                  return 'error';
                });

              if (rooms === 'error') {
                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                  location: `${moduleName}:${methodName}`,
                  message: 'Room.count() error',
                  // clientGuid,
                  // accountGuid,
                  errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                  payload: {
                    where: {
                      active: true,
                      platinum: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.platinum}
                    },
                  },
                });
              }

              break;

            case 'star':

              rooms = await Room.find({
                where: {
                  active: true,
                  star: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.star}
                },
              })
                .usingConnection(db)
                .tolerate(async (err) => {

                  err.details = {
                    where: {
                      active: true,
                      star: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.star}
                    },
                  };

                  await LogProcessor.dbError({
                    error: err,
                    message: 'Room.find() error',
                    // clientGuid,
                    // accountGuid,
                    // requestId: null,
                    // childRequestId: null,
                    location: `${moduleName}:${methodName}`,
                    payload: {
                      where: {
                        active: true,
                        star: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.star}
                      },
                    },
                  });

                  return 'error';
                });

              if (rooms === 'error') {
                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                  location: `${moduleName}:${methodName}`,
                  message: 'Room.count() error',
                  // clientGuid,
                  // accountGuid,
                  errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                  payload: {
                    where: {
                      active: true,
                      star: {'<': sails.config.custom.config.rooms.accounts_distribution_by_category.star}
                    },
                  },
                });
              }


              break;

            default:
              // throw new Error(`${moduleName}, error: Unknown account category="${accountCategory}"`);

              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.ERROR,
                location: `${moduleName}:${methodName}`,
                message: 'Unknown account category',
                accountGuid: accountRec.guid,
                errorName: sails.config.custom.GENERAL_ERROR.name,
                payload: {
                  accountCategory,
                },
              });

          }


          _.forEach(rooms, function (val) {
            if (!_.find(doNotUseRooms, function (el) {
              return (val.id === el.id);
            })) {
              val.used = false;
            } else {
              val.used = true;
            }
            checkedRooms.push(val);
          });


          totalRooms = await Room.count()
            .usingConnection(db)
            .tolerate(async (err) => {

              err.details = {
                criteria: 'whole table',
              };

              await LogProcessor.dbError({
                error: err,
                message: 'Room.count() error',
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                location: `${moduleName}:${methodName}`,
                payload: {
                  criteria: 'whole table',
                },
              });

              return 'error';
            });

          if (totalRooms === 'error') {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
              location: `${moduleName}:${methodName}`,
              message: 'Room.count() error',
              // clientGuid,
              // accountGuid,
              errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
              payload: {
                criteria: 'whole table',
              },
            });
          }

          if (!totalRooms) {

            /**
             * There are no rooms in Room table yet and we need create it
             */

            roomRec = await Room.create({
              // room: 1,
              bronze: 0,
              gold: 0,
              platinum: 0,
              star: 0,
              accounts_number: 0,
              active: true,
            })
              .fetch()
              .usingConnection(db)
              .tolerate(async (err) => {

                err.details = {
                  // room: 1,
                  bronze: 0,
                  gold: 0,
                  platinum: 0,
                  star: 0,
                  accounts_number: 0,
                  active: true,
                };

                await LogProcessor.dbError({
                  error: err,
                  message: 'Room.create() error',
                  // clientGuid,
                  // accountGuid,
                  // requestId: null,
                  // childRequestId: null,
                  location: `${moduleName}:${methodName}`,
                  payload: {
                    // room: 1,
                    bronze: 0,
                    gold: 0,
                    platinum: 0,
                    star: 0,
                    accounts_number: 0,
                    active: true,
                  },
                });

                return null;
              });

            if (roomRec == null) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                location: `${moduleName}:${methodName}`,
                message: 'Room.create() error',
                // clientGuid,
                // accountGuid,
                errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                payload: {
                  // room: 1,
                  bronze: 0,
                  gold: 0,
                  platinum: 0,
                  star: 0,
                  accounts_number: 0,
                  active: true,
                },
              });
            }

          } else {

            filteredRooms = _.filter(checkedRooms, function (val) {
              return !val.used;
            });

            if (filteredRooms.length > 0) {

              let elemNumber = _.random(0, filteredRooms.length - 1);

              /**
               * Get room record for the specified roomNumber
               */

              roomRec = filteredRooms[elemNumber];

            } else {

              roomRec = await Room.create({
                bronze: 0,
                gold: 0,
                platinum: 0,
                star: 0,
                accounts_number: 0,
                active: true,
              })
                .fetch()
                .usingConnection(db)
                .tolerate(async (err) => {

                  err.details = {
                    bronze: 0,
                    gold: 0,
                    platinum: 0,
                    star: 0,
                    accounts_number: 0,
                    active: true,
                  };

                  await LogProcessor.dbError({
                    error: err,
                    message: 'Room.create() error',
                    // clientGuid,
                    // accountGuid,
                    // requestId: null,
                    // childRequestId: null,
                    location: `${moduleName}:${methodName}`,
                    payload: {
                      bronze: 0,
                      gold: 0,
                      platinum: 0,
                      star: 0,
                      accounts_number: 0,
                      active: true,
                    },
                  });

                  return null;
                });

              if (roomRec == null) {
                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                  location: `${moduleName}:${methodName}`,
                  message: 'Room.create() error',
                  // clientGuid,
                  // accountGuid,
                  errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                  payload: {
                    // room: totalRooms + 1,
                    bronze: 0,
                    gold: 0,
                    platinum: 0,
                    star: 0,
                    accounts_number: 0,
                    active: true,
                  },
                });
              }

            }

          }

          /**
           * Check if the selected room have vacant space
           */

          if (roomRec.accounts_number >= sails.config.custom.config.rooms.accounts_per_room
            || (accountCategory === 'bronze'
              && roomRec.bronze >= sails.config.custom.config.rooms.accounts_distribution_by_category.bronze)
          ) {

            /**
             * We need to create a new room and distribute the existing clients of roomRec
             * between these two rooms
             */

            const newRoom = await Room.create({
              bronze: accountCategory === 'bronze' ? 1 : 0,
              gold: accountCategory === 'gold' ? 1 : 0,
              platinum: accountCategory === 'platinum' ? 1 : 0,
              star: accountCategory === 'star' ? 1 : 0,
              accounts_number: 1,
              active: true,
            })
              .fetch()
              .usingConnection(db)
              .tolerate(async (err) => {

                err.details = {
                  bronze: accountCategory === 'bronze' ? 1 : 0,
                  gold: accountCategory === 'gold' ? 1 : 0,
                  platinum: accountCategory === 'platinum' ? 1 : 0,
                  star: accountCategory === 'star' ? 1 : 0,
                  accounts_number: 1,
                  active: true,
                };

                await LogProcessor.dbError({
                  error: err,
                  message: 'Room.create() error',
                  // clientGuid,
                  // accountGuid,
                  // requestId: null,
                  // childRequestId: null,
                  location: `${moduleName}:${methodName}`,
                  payload: {
                    bronze: accountCategory === 'bronze' ? 1 : 0,
                    gold: accountCategory === 'gold' ? 1 : 0,
                    platinum: accountCategory === 'platinum' ? 1 : 0,
                    star: accountCategory === 'star' ? 1 : 0,
                    accounts_number: 1,
                    active: true,
                  },
                });

                return null;
              });

            if (newRoom == null) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                location: `${moduleName}:${methodName}`,
                message: 'Room.create() error',
                // clientGuid,
                // accountGuid,
                errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                payload: {
                  bronze: accountCategory === 'bronze' ? 1 : 0,
                  gold: accountCategory === 'gold' ? 1 : 0,
                  platinum: accountCategory === 'platinum' ? 1 : 0,
                  star: accountCategory === 'star' ? 1 : 0,
                  accounts_number: 1,
                  active: true,
                },
              });

            }

            await Account.addToCollection(accountRec.id, 'room', newRoom.id)
              .usingConnection(db)
                .tolerate(async (err) => {

                  err.details = {
                    accountRecId: accountRec.id,
                    model: 'room',
                    newRoomId: newRoom.id,
                  };

                  await LogProcessor.dbError({
                    error: err,
                    message: 'Account.addToCollection() error',
                    // clientGuid,
                    // accountGuid,
                    // requestId: null,
                    // childRequestId: null,
                    location: moduleName,
                    payload: {
                      accountRecId: accountRec.id,
                      model: 'room',
                      newRoomId: newRoom.id,
                    },
                  });

                  return true;
                });


            const newRoomUpdated = await sails.helpers.general.mixAccountsInRooms.with({
              db,
              accountRec: accountRec,
              oldRoom: roomRec.id,
              newRoom: newRoom.id
            });

            roomRec = newRoomUpdated;

            // roomRec = newRoom;

          } else {

            const roomRecId = roomRec.id;

            roomRec = await Room.updateOne({id: roomRec.id})
              .set({
                bronze: accountCategory === 'bronze' ? roomRec.bronze + 1 : roomRec.bronze,
                gold: accountCategory === 'gold' ? roomRec.gold + 1 : roomRec.gold,
                platinum: accountCategory === 'platinum' ? roomRec.platinum + 1 : roomRec.platinum,
                star: accountCategory === 'star' ? roomRec.star + 1 : roomRec.star,
                accounts_number: roomRec.accounts_number + 1
              })
              .usingConnection(db)
              .tolerate(async (err) => {

                err.details = {
                  criteria: {
                    id: roomRec.id
                  },
                  data: {
                    bronze: accountCategory === 'bronze' ? roomRec.bronze + 1 : roomRec.bronze,
                    gold: accountCategory === 'gold' ? roomRec.gold + 1 : roomRec.gold,
                    platinum: accountCategory === 'platinum' ? roomRec.platinum + 1 : roomRec.platinum,
                    star: accountCategory === 'star' ? roomRec.star + 1 : roomRec.star,
                    accounts_number: roomRec.accounts_number + 1
                  },
                };

                await LogProcessor.dbError({
                  error: err,
                  message: 'Room.updateOne() error',
                  // clientGuid,
                  // accountGuid,
                  // requestId: null,
                  // childRequestId: null,
                  location: `${moduleName}:${methodName}`,
                  payload: {
                    criteria: {
                      id: roomRec.id
                    },
                    data: {
                      bronze: accountCategory === 'bronze' ? roomRec.bronze + 1 : roomRec.bronze,
                      gold: accountCategory === 'gold' ? roomRec.gold + 1 : roomRec.gold,
                      platinum: accountCategory === 'platinum' ? roomRec.platinum + 1 : roomRec.platinum,
                      star: accountCategory === 'star' ? roomRec.star + 1 : roomRec.star,
                      accounts_number: roomRec.accounts_number + 1
                    },
                  },
                });

                return null;
              });

            if (roomRec == null) {
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
                location: `${moduleName}:${methodName}`,
                message: 'Room.updateOne() error',
                // clientGuid,
                // accountGuid,
                errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
                payload: {
                  criteria: {
                    id: roomRecId
                  },
                  data: {
                  },
                },
              });
            }

            await Account.addToCollection(accountRec.id, 'room', roomRec.id)
              .usingConnection(db)
              .tolerate(async (err) => {

                err.details = {
                  accountRecId: accountRec.id,
                  model: 'room',
                  RoomId: roomRec.id,
                };

                await LogProcessor.dbError({
                  error: err,
                  message: 'Account.addToCollection() error',
                  // clientGuid,
                  // accountGuid,
                  // requestId: null,
                  // childRequestId: null,
                  location: `${moduleName}:${methodName}`,
                  payload: {
                    accountRecId: accountRec.id,
                    model: 'room',
                    RoomId: roomRec.id,
                  },
                });

                return true;
              });

          }

          const ReleaseLock = await sails
            .sendNativeQuery(sqlReleaseLockAllocateRoom)
            .usingConnection(db);

          const releaseLockRes = _.get(ReleaseLock, 'rows[0].releaseAllocateRoomLockResult', null);

          if (releaseLockRes == null) {
            await LogProcessor.critical({
              message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
              // clientGuid,
              // accountGuid,
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
              // accountGuid,
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

          return roomRec;

        } catch (eee) {

          const ReleaseLock = await sails
            .sendNativeQuery(sqlReleaseLockAllocateRoom)
            .usingConnection(db);

          const releaseLockRes = _.get(ReleaseLock, 'rows[0].releaseAllocateRoomLockResult', null);

          if (releaseLockRes == null) {
            await LogProcessor.critical({
              message: sails.config.custom.DB_ERROR_RELEASE_LOCK_WRONG_RESPONSE.message,
              // clientGuid,
              // accountGuid,
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
              // accountGuid,
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
              error: eee,
              location: `${moduleName}:${methodName}`,
              throwError: true,
            });
          } else {
            await sails.helpers.general.catchErrorJoi({
              error: eee,
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

    return resultRoomRec;

  } catch (e) {

    const throwError = true;
    if (throwError) {
      return await sails.helpers.general.catchErrorJoi({
        error: e,
        location: `${moduleName}:${methodName}`,
        throwError: true,
      });
    } else {
      await sails.helpers.general.catchErrorJoi({
        error: e,
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
}

