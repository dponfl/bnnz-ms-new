module.exports = {


  friendlyName: 'Get service',


  description: 'Get service related info by service name',


  inputs: {
    serviceName: {
      friendlyName: 'serviceName',
      description: 'Service name',
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

    try {

      let serviceRecord = await Service.findOne({
        name: inputs.serviceName,
        deleted: false,
      });

      if (!serviceRecord) {

        /**
         * record for the specified criteria was not found
         */

        const errorLocation = 'api/helpers/storage/get-service';
        const errorMsg = sails.config.custom.SERVICE_NOT_FOUND;

        sails.log.error(errorLocation + ', error: ' + errorMsg);

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

        return exits.success({
          status: 'ok',
          message: sails.config.custom.SERVICE_FOUND,
          payload: {
            id: serviceRecord.id,
            guid: serviceRecord.guid,
            name: serviceRecord.name,
            funnel_name: serviceRecord.funnel_name,
            funnel_start: serviceRecord.funnel_start,
            rooms: serviceRecord.rooms,
            max_outgoing_posts_per_day: serviceRecord.max_outgoing_posts_per_day,
            max_incoming_posts_per_day: serviceRecord.max_incoming_posts_per_day,
            deleted: serviceRecord.deleted,
            created_at: serviceRecord.createdAt,
            updated_at: serviceRecord.updatedAt,
          }
        });

      }

    } catch (e) {

      const errorLocation = 'api/helpers/storage/get-service';
      const errorMsg = sails.config.custom.SERVICE_GENERAL_ERROR;

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


};

