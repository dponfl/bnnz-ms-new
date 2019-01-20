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

    err: {
      description: 'Error',
    }

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
            helper: 'getService',
            message: sails.config.custom.SERVICE_NOT_FOUND,
            payload: inputs.serviceName
          }};

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
            messages: serviceRecord.messages,
            messages_to_stars: serviceRecord.messages_to_stars,
            check_profile: serviceRecord.check_profile,
            check_payment: serviceRecord.check_payment,
            check_subscription: serviceRecord.check_subscription,
            deleted: serviceRecord.deleted,
          }
        });

      }

    } catch (e) {

      throw {err: {
          helper: 'getService',
          message: sails.config.custom.SERVICE_GENERAL_ERROR,
          payload: inputs.serviceKey
        }};

    }

  }


};

