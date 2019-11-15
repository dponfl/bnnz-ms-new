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

    if (!uuid.isAPIKey(inputs.serviceKey)) {

      const errorLocation = 'api/helpers/storage/get-service-ref';
      const errorMsg = sails.config.custom.SERVICEREF_NOT_API_KEY;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', {
        params: inputs,
      });

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

    let serviceRefRecord;

    try {

      serviceRefRecord = await ServiceRef.findOne({
        key: inputs.serviceKey,
        used: false,
        deleted: false,
      });

    } catch (e) {

      const errorLocation = 'api/helpers/storage/get-service-ref';
      const errorMsg = sails.config.custom.SERVICEREF_GENERAL_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

    // sails.log.info('ServiceRef.findOne, serviceRefRecord: ', serviceRefRecord);

    if (!serviceRefRecord) {

      /**
       * record for the specified criteria was not found
       */

      const errorLocation = 'api/helpers/storage/get-service-ref';
      const errorMsg = sails.config.custom.SERVICEREF_NOT_FOUND;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', {
        params: inputs,
      });

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

    } else {

      /**
       * found record for the specified criteria
       */

      try {

        await ServiceRef.update({key: inputs.serviceKey}).set({used: true});

        return exits.success({
          status: 'ok',
          message: sails.config.custom.SERVICEREF_FOUND,
          payload: {
            guid: serviceRefRecord.guid,
            key: serviceRefRecord.key,
            service: serviceRefRecord.service,
          }
        });

      } catch (e) {

        const errorLocation = 'api/helpers/storage/get-service-ref';
        const errorMsg = sails.config.custom.SERVICEREF_UPDATE_ERROR;

        sails.log.error(errorLocation + ', error: ' + errorMsg);
        sails.log.error(errorLocation + ', error details: ', e);

        throw {err: {
            module: errorLocation,
            message: errorMsg,
            payload: {},
          }
        };
      }

    }

  }


};

