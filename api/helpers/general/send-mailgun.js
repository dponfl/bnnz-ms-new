"use strict";

const Mailgun = require('mailgun-js');


module.exports = {


  friendlyName: 'Send email',


  description: 'Send email using Mailgun',


  inputs: {

    subject: {
      friendlyName: 'Email subject',
      description: 'Email subject',
      type: 'string',
      required: true,
    },

    html: {
      friendlyName: 'Email body',
      description: 'Email body',
      type: 'string',
      required: true,
    }

  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: 'Error exit',
    },

  },


  fn: async function (inputs, exits) {

    const api_key = process.env.MAILGUN_API_KEY || 'none';
    const domain = process.env.MAILGUN_DOMAIN || 'none';

    const data = {
      from: 'info@webstudiopro.info',
      to: 'dshchfl@gmail.com',
      subject: inputs.subject,
      html: inputs.html,
    };

    try {

      const mailgun = new Mailgun({apiKey: api_key, domain: domain});

      mailgun.messages().send(data, function (err, body) {

        sails.log.debug('sendMailgun, sending mail...');

        if (err) {

          // sails.log.error('sendMailgun, sending mail, error: ', err);

          throw {
            err: {
              module: 'api/helpers/general/send-mailgun',
              message: sails.config.custom.SEND_MAILGUN_SEND_MESSAGE_ERROR,
              payload: {
                params: inputs,
                error: err
              }
            }
          };

        }

        // sails.log.debug('sendMailgun, email was successfully sent: ', body);

        return exits.success({
          status: 'ok',
          message: 'Email was successfully sent',
          payload: body,
        })

      });

    } catch (e) {

      throw {err: {
          module: 'api/helpers/general/send-mailgun',
          message: sails.config.custom.SEND_MAILGUN_GENERAL_ERROR,
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

