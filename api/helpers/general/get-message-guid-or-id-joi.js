"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'general:get-message-guid-or-id-joi';


module.exports = {


  friendlyName: 'general:get-message-guid-or-id-joi',


  description: 'general:get-message-guid-or-id-joi',


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
      messageGuid: Joi
        .string()
        .description('message guid')
        .guid(),
      messageId: Joi
        .string()
        .description('message_id'),
      otherCriteria: Joi
        .any()
        .description('additional criteria to search record'),
    })
      .xor(['messageGuid', 'messageId']);

    let input;

    let messageGuid;
    let messageId;
    let messageRecs;


    try {

      input = await schema.validateAsync(inputs.params);

      messageGuid = input.messageGuid;
      messageId = input.messageId;

      if (!_.isNil(messageGuid)) {

        const msgGetParams = {
          criteria: {
            messageGuid,
          }
        };

        if (!_.isNil(input.otherCriteria)) {
          _.assign(msgGetParams.criteria, input.otherCriteria);
        }

        const msgRecRaw = await sails.helpers.storage.messageGetJoi(msgGetParams);

        if (
          _.isNil(msgRecRaw.status)
          || msgRecRaw.status !== 'success'
          || _.isNil(msgRecRaw.payload)
        ) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
            location: moduleName,
            message: 'Wrong messageGetJoi response',
            errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
            payload: {
              msgGetParams,
              msgRecRaw,
            },
          });
        }

        messageRecs = msgRecRaw.payload;

        messageId = messageRecs[0].messageId;

      }

      if (!_.isNil(messageId)) {

        const msgGetParams = {
          criteria: {
            messageId,
          }
        };

        if (!_.isNil(input.otherCriteria)) {
          _.assign(msgGetParams.criteria, input.otherCriteria);
        }

        const msgRecRaw = await sails.helpers.storage.messageGetJoi(msgGetParams);

        if (
          _.isNil(msgRecRaw.status)
          || msgRecRaw.status !== 'success'
          || _.isNil(msgRecRaw.payload)
        ) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
            location: moduleName,
            message: 'Wrong messageGetJoi response',
            errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
            payload: {
              msgGetParams,
              msgRecRaw,
            },
          });
        }

        messageRecs = msgRecRaw.payload;

        messageGuid = messageRecs[0].messageGuid;

      }

      return exits.success({
        messageGuid,
        messageId,
        messageRecs,
      });

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            messageGuid,
            messageId,
            messageRecs,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            messageGuid,
            messageId,
            messageRecs,
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

