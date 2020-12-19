"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'module:helper';


module.exports = {


  friendlyName: 'module:helper',


  description: 'module:helper',


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
      client: Joi
        .any()
        .required(),
      messageData: Joi
        .any()
        .required(),
      additionalParams: Joi
        .any(),
    });

    let input;

    let clientGuid;
    let accountGuid;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      const chatBlastPerformanceRec = input.additionalParams.chatBlastPerformanceRec;

      const findCriteria = {
        id: 'XXX',
      };

      const block = _.find(chatBlastPerformanceRec.actionsList, findCriteria);

      if (block) {

        if (block.message_id == null) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block has no message_id',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.CHAT_BLASTS_ERROR_NO_ELEMENT.name,
            payload: {
              block,
            },
          });
        }

        /**
         * Действия с данными блока
         */

      } else {

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Block not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.CHAT_BLASTS_ERROR_NO_ELEMENT.name,
          payload: {
            actionsList: chatBlastPerformanceRec.actionsList,
            findCriteria,
          },
        });

      }



      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
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
          }
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          }
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

