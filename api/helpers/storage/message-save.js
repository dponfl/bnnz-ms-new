module.exports = {


  friendlyName: 'Message save',


  description: 'Save all communication between client and bot',


  inputs: {

    message: {
      friendlyName: 'message',
      description: 'message',
      type: 'string',
      required: true,
    },
    message_format: {
      friendlyName: 'message_format',
      description: 'message type: command, simple, forced or callback',
      type: 'string',
      required: true,
    },

    messenger: {
      friendlyName: 'messenger',
      description: 'Messenger name',
      type: 'string',
      required: true,
    },

    message_originator: {
      friendlyName: 'message_originator',
      description: 'Who originated the message: client or bot',
      type: 'string',
      required: true,
    },

    client_id: {
      friendlyName: 'client_id',
      description: 'Link to the Client record',
      type: 'string',
      required: true,
    },

    client_guid: {
      friendlyName: 'client_guid',
      description: 'Link to the Client record',
      type: 'string',
      required: true,
    },

    message_buttons: {
      friendlyName: 'message_buttons',
      description: 'JSON for buttons of the message',
      type: 'ref',
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

      await Message.create({
        client_id: inputs.client_id,
        client_guid: inputs.client_guid,
        message: inputs.message,
        message_format: inputs.message_format,
        message_buttons: inputs.message_buttons || {},
        messenger: inputs.messenger,
        message_originator: inputs.message_originator,
      });

      return exits.success({
        status: 'ok',
        message: 'Message record created',
        payload: {},
      })

    } catch (e) {

      throw {err: {
          module: 'api/helpers/storage/message-save',
          message: sails.config.custom.MESSAGESAVE_ERROR,
          payload: {
            client_id: inputs.client_id,
            client_guid: inputs.client_guid,
            message: inputs.message,
            message_format: inputs.message_format,
            message_buttons: inputs.message_buttons || {},
            messenger: inputs.messenger,
            message_originator: inputs.message_originator,
            error: e.message || 'no error message',
          }
        }
      };

    }

  }


};

