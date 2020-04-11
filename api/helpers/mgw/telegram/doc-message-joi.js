"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'mgw:telegram:doc-message-joi';

module.exports = {


  friendlyName: 'Document message Telegram',


  description: 'Send document message on Telegram messenger',


  inputs: {

    params: {
      friendlyName: 'input params',
      description: 'input params',
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
    },
  },


  fn: async function (inputs, exits) {

    // sails.log.info('Telegram video message: ', inputs);

    const schema = Joi.object({
      chatId: Joi
        .string()
        .description('client chat id we use to send message')
        .required(),
      docPath: Joi
        .string()
        .description('document url')
        .uri()
        .required(),
      html: Joi
        .string()
        .description('html code of the message'),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      let messageObj = {
        parse_mode: 'HTML'
      };

      if (input.html) {
        messageObj.caption = input.html;
      }

      let sendMessageRes = await sails.config.custom.telegramBot.sendDocument(
        input.chatId,
        input.docPath,
        messageObj
      );

      return exits.success({
        status: 'ok',
        message: 'Telegram doc message was sent',
        payload: sendMessageRes,
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: ${sails.config.custom.DOCUMENT_MESSAGE_SEND_ERROR}`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {
        err: {
          module: errorLocation,
          message: errorMsg,
          payload: {
            error: e,
          },
        }
      };

    }

  }

};

