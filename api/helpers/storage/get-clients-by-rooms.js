"use strict";

const _ = require('lodash');

const moduleName = 'Helper storage:get-clients-by-rooms';

module.exports = {


  friendlyName: 'Get clients list by rooms list',


  description: 'Returns the array of clients records by rooms list',


  inputs: {
    rooms: {
      friendlyName: 'rooms',
      description: 'Array of rooms',
      type: 'ref',
      required: true,
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    sails.log.info(moduleName + ', inputs: ', inputs);

    let clientsList = {};

    try {

      for (const room of inputs.rooms) {
        const accountsListByRoom = await Account.find({
          where: {
            subscription_active: true,
            deleted: false,
          }
        })
          .populate('service')
          .populate('room', {
            where: {
              id: room,
            }
          })
          .tolerate(async (err) => {

            err.details = {
              where: {
                subscription_active: true,
                deleted: false,
              }
            };

            await LogProcessor.dbError({
              error: err,
              message: 'Account.find() error',
              // clientGuid,
              // accountGuid,
              // requestId: null,
              // childRequestId: null,
              location: moduleName,
              payload: {
                where: {
                  subscription_active: true,
                  deleted: false,
                }
              },
            });

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Account.find() error',
              // clientGuid,
              // accountGuid,
              errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
              payload: {
                where: {
                  subscription_active: true,
                  deleted: false,
                }
              },
            });


            return [];
          });

        for (const acc of accountsListByRoom) {

          if (acc.posts_received_day < acc.service.max_incoming_posts_per_day) {

            const clientRecord = await Client.findOne({
              where: {
                id: acc.client,
                deleted: false,
                banned: false,
              }
            })
              .tolerate(async (err) => {

                err.details = {
                  where: {
                    id: acc.client,
                    deleted: false,
                    banned: false,
                  }
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
                    where: {
                      id: acc.client,
                      deleted: false,
                      banned: false,
                    }
                  },
                });

                return null;
              });

            // sails.log.warn('clientRecord: ', clientRecord);

            if (clientRecord != null) {

              /**
               * Record for the client was found
               */

              clientsList[clientRecord.id] = {
                client: _.pick(clientRecord, [
                  'id',
                  'guid',
                  'first_name_c',
                  'last_name_c',
                  'chat_id',
                  'username',
                  'messenger',
                  'deleted',
                  'banned',
                  'role',
                  'lang',
                  'account_use',
                ]),
                account: _.pick(acc, [
                  'id',
                  'guid',
                  'inst_profile',
                  'posts_received_day',
                  'posts_received_total',
            ]),
              } ;

              // sails.log.warn('clientsList: ', clientsList);
            }
          }
        }
      }

      // sails.log.info('clientsList: ', clientsList);

      return exits.success({
        status: 'ok',
        message: 'List of clients',
        payload: clientsList,
      })

    } catch (e) {

      // sails.log.error('api/helpers/storage/get-clients-by-rooms, error: ', e);
      //
      // throw {err: {
      //     module: 'api/helpers/storage/get-clients-by-rooms',
      //     message: sails.config.custom.GENERAL_HELPER_ERROR,
      //     payload: {},
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


