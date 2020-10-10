"use strict"

const moduleName = 'general:mix-accounts-in-rooms';

module.exports = {


  friendlyName: 'Mix accounts for two rooms',


  description: 'Mix accounts of oldRoom between oldRoom and newRoom',


  inputs: {
    db: {
      friendlyName: 'database connection',
      description: 'database connection',
      type: 'ref',
      required: true,
    },

    accountRec: {
      friendlyName: 'account record',
      description: 'account record',
      type: 'ref',
      required: true,
    },

    oldRoom: {
      friendlyName: 'oldRoom number',
      description: 'oldRoom number',
      type: 'number',
      required: true,
    },

    newRoom: {
      friendlyName: 'newRoom number',
      description: 'newRoom number',
      type: 'number',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    let clientGuid;
    let accountGuid;
    const db = inputs.db;

    try {

    // sails.log.info(`*** ${moduleName} ***`);
    // sails.log.debug(`input params: ${JSON.stringify(inputs, null, '   ')}`);

    const oldRoomWithAccounts = await Room.findOne({id: inputs.oldRoom})
      .populate('account')
      .usingConnection(db)
      .tolerate(async (err) => {

        err.details = {
          id: inputs.oldRoom,
        };

        await LogProcessor.dbError({
          error: err,
          message: 'Room.findOne() error',
          // clientGuid,
          // accountGuid,
          // requestId: null,
          // childRequestId: null,
          location: moduleName,
          payload: {
            id: inputs.oldRoom,
          },
        });

        return 'error';
      });

    if (oldRoomWithAccounts === 'error') {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.CRITICAL,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
        location: moduleName,
        message: 'Room.findOne() error',
        // clientGuid,
        // accountGuid,
        errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
        payload: {
          id: inputs.oldRoom,
        },
      });
    }

    const newRoomWithAccounts = await Room.findOne({id: inputs.newRoom})
      .usingConnection(db)
      .tolerate(async (err) => {

        err.details = {
          id: inputs.newRoom,
        };

        await LogProcessor.dbError({
          error: err,
          message: 'Room.findOne() error',
          // clientGuid,
          // accountGuid,
          // requestId: null,
          // childRequestId: null,
          location: moduleName,
          payload: {
            id: inputs.newRoom,
          },
        });

        return 'error';
      });

      if (oldRoomWithAccounts === 'error') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Room.findOne() error',
          // clientGuid,
          // accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            id: inputs.newRoom,
          },
        });
      }

    const client = await Client.findOne({id: inputs.accountRec.client})
      .usingConnection(db)
      .tolerate(async (err) => {

        err.details = {
          id: inputs.accountRec.client
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
            id: inputs.accountRec.client
          },
        });

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Client.findOne() error',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            id: inputs.accountRec.client
          },
        });


        return true;
      });

    clientGuid = client.guid;
    accountGuid = inputs.accountRec.guid;

    // sails.log.warn('oldRoomWithAccounts: ', oldRoomWithAccounts);
    // sails.log.warn('newRoomWithAccounts: ', newRoomWithAccounts);


      // _.forEach(oldRoomWithAccounts.account, async function (accountRec) {

      let accountNumber = 0;

      for (const accountRec of oldRoomWithAccounts.account) {

        // sails.log.warn('accountRec: ', accountRec);

        // TODO: Убрать после отладки
        // accountNumber++;
        // await LogProcessor.warn({
        //   message: 'Starting work with new account',
        //   location: moduleName,
        //   payload: {
        //     totalAccounts: oldRoomWithAccounts.account.length,
        //     thisAccountNumber: accountNumber,
        //     accountId: accountRec.id,
        //     accountGuid: accountRec.guid,
        //   },
        // });




        if (
          !client.deleted
          && !client.banned
          && !accountRec.deleted
          && !accountRec.banned
          && accountRec.service_subscription_finalized
          && accountRec.subscription_active
        ) {

          const accountCategory = sails.config.custom.config.rooms.category_by_service[inputs.accountRec.service.name];

          if (accountCategory == null) {
            // throw new Error(`${moduleName}, error: Unknown account category="${accountCategory}" for inputs.accountRec.service.name=${inputs.accountRec.service.name}`);
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Unknown account category at config',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.GENERAL_ERROR.name,
              payload: {
                accountCategory,
                serviceName: inputs.accountRec.service.name,
                inputs,
              },
            });
          }

          const newRoomHasSpaceToAllocateAccount = newRoomWithAccounts[accountCategory] < sails.config.custom.config.rooms.accounts_distribution_by_category[accountCategory];

          if (_.random(0, 1) && newRoomHasSpaceToAllocateAccount) {

            // sails.log.info('Gonna re-allocate this account: ', accountRec);

            // TODO: Убрать после отладки
            // await LogProcessor.warn({
            //   message: 'Gonna re-allocate this account',
            //   location: moduleName,
            //   payload: {
            //     accountId: accountRec.id,
            //     accountGuid: accountRec.guid,
            //     oldRoom: oldRoomWithAccounts.id,
            //     newRoom: newRoomWithAccounts.id,
            //   },
            // });



            await Account.removeFromCollection(accountRec.id, 'room', oldRoomWithAccounts.id)
              .usingConnection(db)
              .tolerate(async (err) => {

                err.details = {
                  accountRecId: accountRec.id,
                  model: 'room',
                  oldRoomWithAccountsId: oldRoomWithAccounts.id,
                };

                await LogProcessor.dbError({
                  error: err,
                  message: 'Account.removeFromCollection() error',
                  // clientGuid,
                  // accountGuid,
                  // requestId: null,
                  // childRequestId: null,
                  location: moduleName,
                  payload: {
                    accountRecId: accountRec.id,
                    model: 'room',
                    oldRoomWithAccountsId: oldRoomWithAccounts.id,
                  },
                });

                return true;
              });

            await Account.addToCollection(accountRec.id, 'room', newRoomWithAccounts.id)
              .usingConnection(db)
              .tolerate(async (err) => {

                err.details = {
                  accountRecId: accountRec.id,
                  model: 'room',
                  newRoomWithAccountsId: newRoomWithAccounts.id,
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
                    newRoomWithAccountsId: newRoomWithAccounts.id,
                  },
                });

                return true;
              });

            switch (accountCategory) {
              case 'bronze':
                await Room.updateOne({id: oldRoomWithAccounts.id})
                  .set({
                    bronze: oldRoomWithAccounts.bronze - 1,
                    accounts_number: oldRoomWithAccounts.accounts_number - 1,
                  })
                  .usingConnection(db)
                  .tolerate(async (err) => {

                    err.details = {
                      criteria: {
                        id: oldRoomWithAccounts.id
                      },
                      data: {
                        bronze: oldRoomWithAccounts.bronze - 1,
                        accounts_number: oldRoomWithAccounts.accounts_number - 1,
                      }
                    };

                    await LogProcessor.dbError({
                      error: err,
                      message: 'Room.updateOne() error',
                      // clientGuid,
                      // accountGuid,
                      // requestId: null,
                      // childRequestId: null,
                      location: moduleName,
                      payload: {
                        criteria: {
                          id: oldRoomWithAccounts.id
                        },
                        data: {
                          bronze: oldRoomWithAccounts.bronze - 1,
                          accounts_number: oldRoomWithAccounts.accounts_number - 1,
                        }
                      },
                    });

                    return true;
                  });

                await Room.updateOne({id: newRoomWithAccounts.id})
                  .set({
                    bronze: newRoomWithAccounts.bronze + 1,
                    accounts_number: newRoomWithAccounts.accounts_number + 1,
                  })
                  .usingConnection(db)
                  .tolerate(async (err) => {

                    err.details = {
                      criteria: {
                        id: newRoomWithAccounts.id
                      },
                      data: {
                        bronze: newRoomWithAccounts.bronze + 1,
                        accounts_number: newRoomWithAccounts.accounts_number + 1,
                      }
                    };

                    await LogProcessor.dbError({
                      error: err,
                      message: 'Room.updateOne() error',
                      // clientGuid,
                      // accountGuid,
                      // requestId: null,
                      // childRequestId: null,
                      location: moduleName,
                      payload: {
                        criteria: {
                          id: newRoomWithAccounts.id
                        },
                        data: {
                          bronze: newRoomWithAccounts.bronze + 1,
                          accounts_number: newRoomWithAccounts.accounts_number + 1,
                        }
                      },
                    });

                    return true;
                  });


                // oldRoomWithAccounts.bronze = oldRoomWithAccounts.bronze - 1;
                // oldRoomWithAccounts.accounts_number = oldRoomWithAccounts.accounts_number - 1;
                // newRoomWithAccounts.bronze = newRoomWithAccounts.bronze + 1;
                // newRoomWithAccounts.accounts_number = newRoomWithAccounts.accounts_number + 1;
                oldRoomWithAccounts.bronze--;
                oldRoomWithAccounts.accounts_number--;
                newRoomWithAccounts.bronze++;
                newRoomWithAccounts.accounts_number++;
                break;

              case 'gold':
                await Room.updateOne({id: oldRoomWithAccounts.id})
                  .set({
                    gold: oldRoomWithAccounts.gold - 1,
                    accounts_number: oldRoomWithAccounts.accounts_number - 1,
                  })
                  .usingConnection(db)
                  .tolerate(async (err) => {

                    err.details = {
                      criteria: {
                        id: oldRoomWithAccounts.id
                      },
                      data: {
                        gold: oldRoomWithAccounts.gold - 1,
                        accounts_number: oldRoomWithAccounts.accounts_number - 1,
                      }
                    };

                    await LogProcessor.dbError({
                      error: err,
                      message: 'Room.updateOne() error',
                      // clientGuid,
                      // accountGuid,
                      // requestId: null,
                      // childRequestId: null,
                      location: moduleName,
                      payload: {
                        criteria: {
                          id: oldRoomWithAccounts.id
                        },
                        data: {
                          gold: oldRoomWithAccounts.gold - 1,
                          accounts_number: oldRoomWithAccounts.accounts_number - 1,
                        }
                      },
                    });

                    return true;
                  });


                await Room.updateOne({id: newRoomWithAccounts.id})
                  .set({
                    gold: newRoomWithAccounts.gold + 1,
                    accounts_number: newRoomWithAccounts.accounts_number + 1,
                  })
                  .usingConnection(db)
                  .tolerate(async (err) => {

                    err.details = {
                      criteria: {
                        id: newRoomWithAccounts.id
                      },
                      data: {
                        gold: newRoomWithAccounts.gold + 1,
                        accounts_number: newRoomWithAccounts.accounts_number + 1,
                      }
                    };

                    await LogProcessor.dbError({
                      error: err,
                      message: 'Room.updateOne() error',
                      // clientGuid,
                      // accountGuid,
                      // requestId: null,
                      // childRequestId: null,
                      location: moduleName,
                      payload: {
                        criteria: {
                          id: newRoomWithAccounts.id
                        },
                        data: {
                          gold: newRoomWithAccounts.gold + 1,
                          accounts_number: newRoomWithAccounts.accounts_number + 1,
                        }
                      },
                    });

                    return true;
                  });


                // oldRoomWithAccounts.gold = oldRoomWithAccounts.gold - 1;
                // oldRoomWithAccounts.accounts_number = oldRoomWithAccounts.accounts_number - 1;
                // newRoomWithAccounts.gold = newRoomWithAccounts.gold + 1;
                // newRoomWithAccounts.accounts_number = newRoomWithAccounts.accounts_number + 1;
                oldRoomWithAccounts.gold--;
                oldRoomWithAccounts.accounts_number--;
                newRoomWithAccounts.gold++;
                newRoomWithAccounts.accounts_number++;
                break;

              case 'platinum':
                await Room.updateOne({id: oldRoomWithAccounts.id})
                  .set({
                    platinum: oldRoomWithAccounts.platinum - 1,
                    accounts_number: oldRoomWithAccounts.accounts_number - 1,
                  })
                  .usingConnection(db)
                  .tolerate(async (err) => {

                    err.details = {
                      criteria: {
                        id: oldRoomWithAccounts.id
                      },
                      data: {
                        platinum: oldRoomWithAccounts.platinum - 1,
                        accounts_number: oldRoomWithAccounts.accounts_number - 1,
                      }
                    };

                    await LogProcessor.dbError({
                      error: err,
                      message: 'Room.updateOne() error',
                      // clientGuid,
                      // accountGuid,
                      // requestId: null,
                      // childRequestId: null,
                      location: moduleName,
                      payload: {
                        criteria: {
                          id: oldRoomWithAccounts.id
                        },
                        data: {
                          platinum: oldRoomWithAccounts.platinum - 1,
                          accounts_number: oldRoomWithAccounts.accounts_number - 1,
                        }
                      },
                    });

                    return true;
                  });


                await Room.updateOne({id: newRoomWithAccounts.id})
                  .set({
                    platinum: newRoomWithAccounts.platinum + 1,
                    accounts_number: newRoomWithAccounts.accounts_number + 1,
                  })
                  .usingConnection(db)
                  .tolerate(async (err) => {

                    err.details = {
                      criteria: {
                        id: newRoomWithAccounts.id
                      },
                      data: {
                        platinum: newRoomWithAccounts.platinum + 1,
                        accounts_number: newRoomWithAccounts.accounts_number + 1,
                      }
                    };

                    await LogProcessor.dbError({
                      error: err,
                      message: 'Room.updateOne() error',
                      // clientGuid,
                      // accountGuid,
                      // requestId: null,
                      // childRequestId: null,
                      location: moduleName,
                      payload: {
                        criteria: {
                          id: newRoomWithAccounts.id
                        },
                        data: {
                          platinum: newRoomWithAccounts.platinum + 1,
                          accounts_number: newRoomWithAccounts.accounts_number + 1,
                        }
                      },
                    });

                    return true;
                  });


                // oldRoomWithAccounts.platinum = oldRoomWithAccounts.platinum - 1;
                // oldRoomWithAccounts.accounts_number = oldRoomWithAccounts.accounts_number - 1;
                // newRoomWithAccounts.platinum = newRoomWithAccounts.platinum + 1;
                // newRoomWithAccounts.accounts_number = newRoomWithAccounts.accounts_number + 1;
                oldRoomWithAccounts.platinum--;
                oldRoomWithAccounts.accounts_number--;
                newRoomWithAccounts.platinum++;
                newRoomWithAccounts.accounts_number++;
                break;

              case 'star':
                await Room.updateOne({id: oldRoomWithAccounts.id})
                  .set({
                    star: oldRoomWithAccounts.star - 1,
                    accounts_number: oldRoomWithAccounts.accounts_number - 1,
                  })
                  .usingConnection(db)
                  .tolerate(async (err) => {

                    err.details = {
                      criteria: {
                        id: oldRoomWithAccounts.id
                      },
                      data: {
                        star: oldRoomWithAccounts.star - 1,
                        accounts_number: oldRoomWithAccounts.accounts_number - 1,
                      }
                    };

                    await LogProcessor.dbError({
                      error: err,
                      message: 'Room.updateOne() error',
                      // clientGuid,
                      // accountGuid,
                      // requestId: null,
                      // childRequestId: null,
                      location: moduleName,
                      payload: {
                        criteria: {
                          id: oldRoomWithAccounts.id
                        },
                        data: {
                          star: oldRoomWithAccounts.star - 1,
                          accounts_number: oldRoomWithAccounts.accounts_number - 1,
                        }
                      },
                    });

                    return true;
                  });


                await Room.updateOne({id: newRoomWithAccounts.id})
                  .set({
                    star: newRoomWithAccounts.star + 1,
                    accounts_number: newRoomWithAccounts.accounts_number + 1,
                  })
                  .usingConnection(db)
                  .tolerate(async (err) => {

                    err.details = {
                      criteria: {
                        id: newRoomWithAccounts.id
                      },
                      data: {
                        star: newRoomWithAccounts.star + 1,
                        accounts_number: newRoomWithAccounts.accounts_number + 1,
                      }
                    };

                    await LogProcessor.dbError({
                      error: err,
                      message: 'Room.updateOne() error',
                      // clientGuid,
                      // accountGuid,
                      // requestId: null,
                      // childRequestId: null,
                      location: moduleName,
                      payload: {
                        criteria: {
                          id: newRoomWithAccounts.id
                        },
                        data: {
                          star: newRoomWithAccounts.star + 1,
                          accounts_number: newRoomWithAccounts.accounts_number + 1,
                        }
                      },
                    });

                    return true;
                  });


                // oldRoomWithAccounts.star = oldRoomWithAccounts.star - 1;
                // oldRoomWithAccounts.accounts_number = oldRoomWithAccounts.accounts_number - 1;
                // newRoomWithAccounts.star = newRoomWithAccounts.star + 1;
                // newRoomWithAccounts.accounts_number = newRoomWithAccounts.accounts_number + 1;
                oldRoomWithAccounts.star--;
                oldRoomWithAccounts.accounts_number--;
                newRoomWithAccounts.star++;
                newRoomWithAccounts.accounts_number++;
                break;

              default:
                // throw new Error(`${moduleName}, error: Unknown account category="${accountCategory}"`);
                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                  location: moduleName,
                  message: 'Unknown account category',
                  clientGuid,
                  accountGuid,
                  errorName: sails.config.custom.GENERAL_ERROR.name,
                  payload: {
                    accountCategory,
                    inputs,
                  },
                });
            }

          } else {

            // TODO: Убрать после отладки
            // await LogProcessor.warn({
            //   message: 'Will not re-allocate this account',
            //   location: moduleName,
            //   payload: {
            //     accountId: accountRec.id,
            //     accountGuid: accountRec.guid,
            //     oldRoom: oldRoomWithAccounts.id,
            //     newRoom: newRoomWithAccounts.id,
            //   },
            // });

          }

        }

      }

      return exits.success(newRoomWithAccounts);

    } catch (e) {

      // const errorLocation = 'api/helpers/general/mix-accounts-in-rooms';
      // const errorMsg = sails.config.custom.GENERAL_HELPER_ERROR;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {},
      //   }
      // };

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
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};

