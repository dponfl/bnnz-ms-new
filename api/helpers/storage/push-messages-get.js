"use strict";

const moduleName = 'message-processor:push-messages-get';


module.exports = {


  friendlyName: 'message-processor:push-messages-get',


  description: 'Fetch push messages data from push_messages table',


  inputs: {

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

      const pushMessages = await PushMessages.findOne({
        active: true,
      });

      if (pushMessages.message_data != null) {

        return exits.success({
          status: 'ok',
          message: 'Push messages data received',
          payload: pushMessages.message_data,
        })

      } else {

        return exits.success({
          status: 'nok',
          message: 'Push messages data NOT received',
          payload: {},
        })

      }

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

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

