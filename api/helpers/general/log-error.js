"use strict";

module.exports = {


  friendlyName: 'Log error',


  description: 'Helper to log all error cases',


  inputs: {
    client_guid: {
      friendlyName: 'client guid',
      description: 'Client guid',
      type: 'string',
      required: true,
    },
    error_message: {
      friendlyName: 'error message',
      description: 'Error message',
      type: 'string',
      required: true,
    },
    level: {
      friendlyName: 'error level',
      description: 'Error level',
      type: 'string',
      required: true,
    },
    payload: {
      friendlyName: 'payload',
      description: 'Payload of the error',
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

    try {

      await Logerror.create({
        client_guid: inputs.client_guid,
        error_message: inputs.error_message,
        level: inputs.level,
        payload: inputs.payload
      });

      return exits.success({
        status: 'ok',
        message: 'Error record created',
        payload: {}
      })

    } catch (e) {

      sails.log.error({
        status: 'nok',
        message: 'Record create error',
        error: e
      });

      throw {err: {
          status: 'nok',
          message: 'Record create error',
          payload: {},
        }
      }

    }


  }


};

