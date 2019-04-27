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

        throw {err: {
            module: 'api/helpers/storage/get-service',
            message: sails.config.custom.SERVICE_NOT_FOUND,
            payload: {
              params: inputs,
            }
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
            posts_per_day: serviceRecord.posts_per_day,
            incoming_posts_per_day: serviceRecord.incoming_posts_per_day,
            deleted: serviceRecord.deleted,
            created_at: serviceRecord.createdAt,
            updated_at: serviceRecord.updatedAt,
          }
        });

      }

    } catch (e) {

      throw {err: {
          module: 'api/helpers/storage/get-service',
          message: sails.config.custom.SERVICE_GENERAL_ERROR,
          payload: {
            params: inputs,
            error: {
              name: e.name || 'no error name',
              message: _.truncate(e.message, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error message',
              stack: _.truncate(e.stack, {length: sails.config.custom.ERROR_MSG_LENGTH}) || 'no error stack',
              code: e.code || 'no error code',
            }
          }
        }
      };

    }

  }


};

