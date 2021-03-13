"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:pending-messages-create-joi';


module.exports = {


  friendlyName: 'storage:pending-messages-create-joi',


  description: 'storage:pending-messages-create-joi',


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
      payload: Joi
        .any()
        .description('PushMessages.sendMessageJoi params'),
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

    let pendingMessageRec;


    try {

      input = await schema.validateAsync(inputs.params);

      const clientGuid = input.clientGuid;
      const accountGuid = input.accountGuid;

      const uuidApiKey = uuid.create();

      pendingMessageRec = input;
      pendingMessageRec.guid = uuidApiKey.uuid;

      await PendingMessages.create(pendingMessageRec)
        .tolerate(async (err) => {

          err.details = {
            pendingMessageRec,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'PendingMessages.create() error',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              pendingMessageRec,
            },
          });

          return true;
        });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: pendingMessageRec,
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
            pendingMessageRec,
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
            pendingMessageRec,
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

