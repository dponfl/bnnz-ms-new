"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'push-messages:common:chat-blasts:after-try-joi';


module.exports = {


  friendlyName: 'push-messages:common:chat-blasts:after-try-joi',


  description: 'push-messages:common:chat-blasts:after-try-joi',


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
    let clientId;

    let msgSaveParams;
    let msgSaveRec;
    let messageGuid;
    let msgQueueCreateParams;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;
      clientId = input.client.id;

      await LogProcessor.info({
        message: 'afterHelper initiated',
        clientGuid,
        accountGuid,
        location: moduleName,
        payload: {},
      });

      const chatBlastPerformanceRec = input.additionalParams.chatBlastPerformanceRec;

      const block = _.find(chatBlastPerformanceRec.actionsList, {id: 'four'});

      if (block) {

        if (_.isNil(block.messageGuid)) {
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block has no messageGuid',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.CHAT_BLASTS_ERROR_NO_ELEMENT.name,
            payload: {
              block
            },
          });
        }

        const {messageId} = await sails.helpers.general.getMessageGuidOrIdJoi({messageGuid: block.messageGuid});


        setTimeout(async () => {

          // const editMessageReplyMarkupRes = await sails.helpers.mgw[input.client.messenger]['editMessageReplyMarkupJoi']({
          //   replyMarkup: {
          //     inline_keyboard: [],
          //   },
          //   optionalParams: {
          //     chat_id: input.client.chat_id,
          //     message_id: block.message_id,
          //   },
          // });

          msgSaveParams = {
            msgSaveParams: {
              action: sails.config.custom.enums.messageSaveActions.CREATE,
              clientGuid,
              accountGuid,
              clientId,
            },
            createdBy: moduleName,
          };

          msgSaveRec = await sails.helpers.storage.messageSaveWrapper(msgSaveParams);

          messageGuid = msgSaveRec.messageGuid;

          msgQueueCreateParams = {
            clientGuid,
            accountGuid,
            messageGuid,
            channel: input.client.messenger,
            chatId: input.client.chat_id,
            clientId,
            msgType: 'editMessageReplyMarkupJoi',
            payload: {
              replyMarkup: {
                inline_keyboard: [],
              },
              optionalParams: {
                chat_id: input.client.chat_id,
                message_id: messageId,
              },
            },
          };

          await sails.helpers.storage.msgQueueCreateWrapper({
            msgQueueCreateParams,
            createdBy: moduleName,
          });

        }, 3000);


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
            findCriteria: {id: 'four'},
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

