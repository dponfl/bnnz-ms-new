"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:msg-queue-create-joi';


module.exports = {


  friendlyName: 'storage:msg-queue-create-joi',


  description: 'storage:msg-queue-create-joi',


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

    const schema = Joi.object({
      clientGuid: Joi
        .string()
        .description('client guid')
        .guid()
        .required(),
      accountGuid: Joi
        .string()
        .description('account guid')
        .guid()
        .required(),
      channel: Joi
        .string()
        .description('channel (e.g. "telegram", "ios")')
        .required(),
      chatId: Joi
        .string()
        .description('chat id')
        .required(),
      clientId: Joi
        .integer()
        .positive()
        .description('client id')
        .required(),
      msgType: Joi
        .string()
        .description('msgType (simpleMessageJoi, etc.)')
        .required(),
      payload: Joi
        .any()
        .description('message params'),
      done: Joi
        .boolean()
        .description('done flag')
        .default(false),
      deleted: Joi
        .boolean()
        .description('deleted flag')
        .default(false),
    });

    let input;

    let messageRec;


    try {

      input = await schema.validateAsync(inputs.params);

      const clientGuid = input.clientGuid;
      const accountGuid = input.accountGuid;

      const uuidApiKey = uuid.create();

      messageRec = input;
      messageRec.guid = uuidApiKey.uuid;

      await MsgQueue.create(messageRec)
        .tolerate(async (err) => {

          err.details = {
            messageRec,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'MsgQueue.create() error',
            clientGuid,
            accountGuid,
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
        status: 'success',
        message: `${moduleName} performed`,
        payload: messageRec,
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
            messageRec,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
            messageRec,
          },
        });
        return exits.success({
          status: 'error',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};

