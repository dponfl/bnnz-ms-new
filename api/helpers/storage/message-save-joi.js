"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:message-save-joi';

module.exports = {


  friendlyName: 'Message save',


  description: 'Save all communication between client and bot',


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
    }

  },


  fn: async function (inputs, exits) {

    let messageRec;

    const schema = Joi.object({
      message: Joi
        .string()
        .required(),
      callback_query_id: Joi
        .string()
        .max(255),
      message_id: Joi
        .number()
        .integer()
        .allow(0),
      message_format: Joi
        .string()
        .max(255)
        .valid(
          sails.config.custom.enums.messageFormat.SIMPLE,
          sails.config.custom.enums.messageFormat.CALLBACK,
          sails.config.custom.enums.messageFormat.FORCED,
          sails.config.custom.enums.messageFormat.IMG,
          sails.config.custom.enums.messageFormat.VIDEO,
          sails.config.custom.enums.messageFormat.STICKER,
          sails.config.custom.enums.messageFormat.DOC,
          sails.config.custom.enums.messageFormat.IMGCALLBACK,
          sails.config.custom.enums.messageFormat.POSTBROADCAST,
          sails.config.custom.enums.messageFormat.PUSHSIMPLE,
          sails.config.custom.enums.messageFormat.PUSHCALLBACK,
          sails.config.custom.enums.messageFormat.PUSHIMGCALLBACK,
          sails.config.custom.enums.messageFormat.PUSHVIDEOCALLBACK,
          sails.config.custom.enums.messageFormat.PUSHFORCED,
          sails.config.custom.enums.messageFormat.PUSHIMG,
          sails.config.custom.enums.messageFormat.PUSHVIDEO,
          sails.config.custom.enums.messageFormat.PUSHSTICKER,
        )
        .required(),
      messenger: Joi
        .string()
        .max(50)
        .valid(sails.config.custom.enums.messenger.TELEGRAM)
        .required(),
      message_originator: Joi
        .string()
        .max(50)
        .valid(
          sails.config.custom.enums.messageOriginator.BOT,
          sails.config.custom.enums.messageOriginator.CLIENT,
        )
        .required(),
      client_id: Joi
        .number()
        .integer()
        .required(),
      client_guid: Joi
        .string()
        .guid()
        .required(),
      message_buttons: Joi.any(),
    });

    try {

      const input = await schema.validateAsync(inputs.params);
      const uuidApiKey = uuid.create();

      messageRec = {
        message_guid: uuidApiKey.uuid,
        client_id: input.client_id,
        client_guid: input.client_guid,
        callback_query_id: input.callback_query_id,
        message: input.message,
        message_id: input.message_id,
        message_format: input.message_format,
        message_buttons: input.message_buttons || {},
        messenger: input.messenger,
        message_originator: input.message_originator,
      };

      // TODO: Если в таблице "messages" будем для полей message & message_buttons менять тип BLOB на TEXT, то нужно будет разкомментить

      // if (input.message != null) {
      //   if (_.isObject(input.message)) {
      //     messageRec.message = await MessageProcessor.clearStr(JSON.stringify(input.message));
      //   } else {
      //     messageRec.message = await MessageProcessor.clearStr(input.message);
      //   }
      // }
      //
      // if (input.message_buttons != null) {
      //   if (_.isObject(input.message_buttons)) {
      //     messageRec.message_buttons = await MessageProcessor.clearStr(JSON.stringify(input.message_buttons));
      //   } else {
      //     messageRec.message_buttons = await MessageProcessor.clearStr(input.message_buttons);
      //   }
      // }

      await Messages.create(messageRec)
        .tolerate(async (err) => {

          err.details = {
            messageRec,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Messages.create() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              messageRec,
            },
          });

          return true;
        });

      return exits.success({
        status: 'ok',
        message: 'Message record created',
        payload: messageRec,
      })

    } catch (e) {

      // const errorLocation = 'api/helpers/storage/message-save-joi';
      // const errorMsg = sails.config.custom.MESSAGESAVE_ERROR;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //       messageRec: messageRec,
      //     },
      //   }
      // };

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }


};

