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

      throw {err: {
          module: 'api/helpers/storage/get-service-ref',
          message: sails.config.custom.SERVICEREF_NOT_API_KEY,
          payload: inputs.serviceKey
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

      throw {err: {
          module: 'api/helpers/storage/get-service-ref',
          message: sails.config.custom.SERVICEREF_GENERAL_ERROR,
          payload: {
            serviceKey: inputs.serviceKey,
            error: e.message || 'no error message',
          }
        }
      };

    }

    sails.log.info('ServiceRef.findOne, serviceRefRecord: ', serviceRefRecord);

    if (!serviceRefRecord) {

      /**
       * record for the specified criteria was not found
       */

      throw {err: {
          module: 'api/helpers/storage/get-service-ref',
          message: sails.config.custom.SERVICEREF_NOT_FOUND,
          payload: inputs.serviceKey
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

        throw {err: {
            module: 'api/helpers/storage/get-service-ref',
            message: sails.config.custom.SERVICEREF_UPDATE_ERROR,
            payload: {
              serviceKey: inputs.serviceKey,
              error: e.message || 'no error message',
            }

          }
        };

      }

    }

  }


};

