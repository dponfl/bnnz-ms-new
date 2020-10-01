"use strict"

const moduleName = 'general:mix-accounts-in-rooms';

module.exports = {


  friendlyName: 'Mix accounts for two rooms',


  description: 'Mix accounts of oldRoom between oldRoom and newRoom',


  inputs: {
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

    try {

    // sails.log.info(`*** ${moduleName} ***`);
    // sails.log.debug(`input params: ${JSON.stringify(inputs, null, '   ')}`);

    const oldRoomWithAccounts = await Room.findOne({room: inputs.oldRoom})
      .populate('account');
    const newRoomWithAccounts = await Room.findOne({room: inputs.newRoom});
    const client = await Client.findOne({id: inputs.accountRec.client})
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
      for (const accountRec of oldRoomWithAccounts.account) {

        // sails.log.warn('accountRec: ', accountRec);

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

          if (_.random(0,1) && newRoomHasSpaceToAllocateAccount) {

            // sails.log.info('Gonna re-allocate this account: ', accountRec);

            await Account.removeFromCollection(accountRec.id, 'room', oldRoomWithAccounts.id)
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
                await Room.updateOne({room: oldRoomWithAccounts.room})
                  .set({
                    bronze: oldRoomWithAccounts.bronze - 1,
                    accounts_number: oldRoomWithAccounts.accounts_number - 1,
                  });
                await Room.updateOne({room: newRoomWithAccounts.room})
                  .set({
                    bronze: newRoomWithAccounts.bronze + 1,
                    accounts_number: newRoomWithAccounts.accounts_number + 1,
                  });
                oldRoomWithAccounts.bronze = oldRoomWithAccounts.bronze - 1;
                oldRoomWithAccounts.accounts_number = oldRoomWithAccounts.accounts_number - 1;
                newRoomWithAccounts.bronze = newRoomWithAccounts.bronze + 1;
                newRoomWithAccounts.accounts_number = newRoomWithAccounts.accounts_number + 1;
                break;

              case 'gold':
                await Room.updateOne({room: oldRoomWithAccounts.room})
                  .set({
                    gold: oldRoomWithAccounts.gold - 1,
                    accounts_number: oldRoomWithAccounts.accounts_number - 1,
                  });
                await Room.updateOne({room: newRoomWithAccounts.room})
                  .set({
                    gold: newRoomWithAccounts.gold + 1,
                    accounts_number: newRoomWithAccounts.accounts_number + 1,
                  });
                oldRoomWithAccounts.gold = oldRoomWithAccounts.gold - 1;
                oldRoomWithAccounts.accounts_number = oldRoomWithAccounts.accounts_number - 1;
                newRoomWithAccounts.gold = newRoomWithAccounts.gold + 1;
                newRoomWithAccounts.accounts_number = newRoomWithAccounts.accounts_number + 1;
                break;

              case 'platinum':
                await Room.updateOne({room: oldRoomWithAccounts.room})
                  .set({
                    platinum: oldRoomWithAccounts.platinum - 1,
                    accounts_number: oldRoomWithAccounts.accounts_number - 1,
                  });
                await Room.updateOne({room: newRoomWithAccounts.room})
                  .set({
                    platinum: newRoomWithAccounts.platinum + 1,
                    accounts_number: newRoomWithAccounts.accounts_number + 1,
                  });
                oldRoomWithAccounts.platinum = oldRoomWithAccounts.platinum - 1;
                oldRoomWithAccounts.accounts_number = oldRoomWithAccounts.accounts_number - 1;
                newRoomWithAccounts.platinum = newRoomWithAccounts.platinum + 1;
                newRoomWithAccounts.accounts_number = newRoomWithAccounts.accounts_number + 1;
                break;

              case 'star':
                await Room.updateOne({room: oldRoomWithAccounts.room})
                  .set({
                    star: oldRoomWithAccounts.star - 1,
                    accounts_number: oldRoomWithAccounts.accounts_number - 1,
                  });
                await Room.updateOne({room: newRoomWithAccounts.room})
                  .set({
                    star: newRoomWithAccounts.star + 1,
                    accounts_number: newRoomWithAccounts.accounts_number + 1,
                  });
                oldRoomWithAccounts.star = oldRoomWithAccounts.star - 1;
                oldRoomWithAccounts.accounts_number = oldRoomWithAccounts.accounts_number - 1;
                newRoomWithAccounts.star = newRoomWithAccounts.star + 1;
                newRoomWithAccounts.accounts_number = newRoomWithAccounts.accounts_number + 1;
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

          }

        }

      }

      return exits.success({
        status: 'ok',
        message: 'Mix accounts in rooms success',
        payload: {
        }
      });

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

