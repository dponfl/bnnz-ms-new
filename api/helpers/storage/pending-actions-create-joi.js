"use strict";

const Joi = require('@hapi/joi');
const uuid = require('uuid-apikey');

const moduleName = 'storage:pending-actions-create-joi';


module.exports = {


  friendlyName: 'storage:pending-actions-create-joi',


  description: 'storage:pending-actions-create-joi',


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
      requestId: Joi
        .string()
        .description('request guid')
        .guid(),
      childRequestId: Joi
        .string()
        .description('child request guid')
        .guid(),
      pendingActionName: Joi
        .string()
        .description('name of pending action')
        .required(),
      actionsPerformed: Joi
        .number()
        .description('number or actions attempts performed')
        .integer()
        .positive(),
      done: Joi
        .boolean()
        .description('done flag'),
      deleted: Joi
        .boolean()
        .description('deleted flag'),
      payload: Joi
        .any()
        .description('payload'),
      payloadResponse: Joi
        .any()
        .description('payloadResponse'),
    });

    let input;

    let pendingActionsRec;


    try {

      input = await schema.validateAsync(inputs.params);

      const uuidApiKey = uuid.create();

      pendingActionsRec = input;
      pendingActionsRec.guid = uuidApiKey.uuid;

      await PendingActions.create(pendingActionsRec)
        .tolerate(async (err) => {

          err.details = {
            pendingActionsRec,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'PendingActions.create() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              pendingActionsRec,
            },
          });

          return true;
        });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          pendingActionsRec,
        },
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            pendingActionsRec,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            pendingActionsRec,
          },
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

