"use strict";

const uuid = require('uuid-apikey');

module.exports = {


  friendlyName: 'Get service level',


  description: 'Get info depends on service level',


  inputs: {
    serviceKey: {
      friendlyName: 'serviceKey',
      description: 'Service key',
      type: 'string',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    // if (!uuid.isAPIKey(inputs.serviceKey)) {
    //
    //   const errorLocation = 'api/helpers/storage/get-service-ref';
    //   const errorMsg = sails.config.custom.SERVICEREF_NOT_API_KEY;
    //
    //   sails.log.error(errorLocation + ', error: ' + errorMsg);
    //   sails.log.error(errorLocation + ', error details: ', {
    //     params: inputs,
    //   });
    //
    //   throw {err: {
    //       module: errorLocation,
    //       message: errorMsg,
    //       payload: {},
    //     }
    //   };
    // }

    let serviceRefRecord;
    let updatedServiceRefRec;
    let serviceRefParams;

    try {

      serviceRefParams = {
        key: inputs.serviceKey,
        used: false,
        deleted: false,
      };

      serviceRefRecord = await ServiceRef.findOne(serviceRefParams)
        .tolerate(async (err) => {

          err.details = {
            serviceRefParams,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'ServiceRef.findOne() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              serviceRefParams,
            },
          });

          return 'error';
        });

      if (serviceRefRecord === 'error') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'ServiceRef.findOne() error',
          // clientGuid,
          // accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            serviceRefParams,
          },
        });
      }

    } catch (e) {

      // const errorLocation = 'api/helpers/storage/get-service-ref';
      // const errorMsg = sails.config.custom.SERVICEREF_GENERAL_ERROR;
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

    // sails.log.info('ServiceRef.findOne, serviceRefRecord: ', serviceRefRecord);

    if (serviceRefRecord == null) {

      /**
       * record for the specified criteria was not found
       */

      // const errorLocation = 'api/helpers/storage/get-service-ref';
      // const errorMsg = sails.config.custom.SERVICEREF_NOT_FOUND;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', {
      //   params: inputs,
      // });
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {},
      //   }
      // };

      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.ERROR,
        location: moduleName,
        message: 'serviceRef for the specified criteria was not found',
        errorName: sails.config.custom.STORAGE_ERROR.name,
        payload: {
          serviceRefParams,
          serviceRefRecord,
        },
      });


    } else {

      /**
       * found record for the specified criteria
       */

      try {

        if (serviceRefRecord.unique) {

          updatedServiceRefRec = await ServiceRef.updateOne({key: inputs.serviceKey}).set({used: true})
            .tolerate(async (err) => {

              err.details = {
                criteria: {
                  key: inputs.serviceKey
                },
                data: {
                  used: true
                }
              };

              await LogProcessor.dbError({
                error: err,
                message: 'ServiceRef.updateOne() error',
                // clientGuid,
                // accountGuid,
                // requestId: null,
                // childRequestId: null,
                location: moduleName,
                payload: {
                  criteria: {
                    key: inputs.serviceKey
                  },
                  data: {
                    used: true
                  }
                },
              });

              return 'error';
            });

          if (updatedServiceRefRec === 'error') {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
              location: moduleName,
              message: 'ServiceRef.updateOne() error',
              // clientGuid,
              // accountGuid,
              errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
              payload: {
                criteria: {
                  key: inputs.serviceKey
                },
                data: {
                  used: true
                }
            });
          }

        } else {

          updatedServiceRefRec = serviceRefRecord;

        }

        return exits.success({
          status: 'ok',
          message: sails.config.custom.SERVICEREF_FOUND,
          // payload: {
          //   guid: serviceRefRecord.guid,
          //   key: serviceRefRecord.key,
          //   service: serviceRefRecord.service,
          // }
          payload: updatedServiceRefRec,
        });

      } catch (e) {

        // const errorLocation = 'api/helpers/storage/get-service-ref';
        // const errorMsg = sails.config.custom.SERVICEREF_UPDATE_ERROR;
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

  }


};

