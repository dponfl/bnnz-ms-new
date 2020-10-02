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
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      const accountCategory = sails.config.custom.config.rooms.category_by_service[input.account.service.name];

      if (accountCategory == null) {
        throw new Error(`${moduleName}, error: Unknown account category for the following input.account.service.name="${input.account.service.name}"`);
      }

      _.forEach(input.account.room, async function (elem) {
        let room = await Room.findOne({id: elem.id})
          .tolerate(async (err) => {

            err.details = {
              id: elem.id,
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
                id: elem.id,
              },
            });

            return null;
          });

        if (room) {
          await Account.removeFromCollection(input.account.id, 'room', room.id)
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
                // accountGuid,
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
                    // accountGuid,
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
                    // accountGuid,
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
                    // accountGuid,
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
                    // accountGuid,
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

            default: throw new Error(`${moduleName}, error: Unknown client category="${accountCategory}"`);
          }

        }
      });

      const rooms = await sails.helpers.general.allocateRoomsJoi({
        accountGuid: input.account.guid,
      });

      return exits.success({
        status: 'ok',
        message: 'Rooms re-allocated to the account',
        payload: {rooms: rooms}
      });

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

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

