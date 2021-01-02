"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'push-messages:common:chat-blasts:callback-try-joi';


module.exports = {


  friendlyName: 'push-messages:common:chat-blasts:callback-try-joi',


  description: 'push-messages:common:chat-blasts:callback-try-joi',


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
        .description('Client record')
        .required(),
      chatBlastsPerformanceRec: Joi
        .any()
        .description('chatBlastsPerformance record')
        .required(),
      buttonId: Joi
        .string()
        .description('button id')
        .required(),
    });

    let input;

    let client;
    let currentAccount;

    let clientGuid;
    let accountGuid;

    let chatBlastsPerformanceRec;


    try {

      input = await schema.validateAsync(inputs.params);

      client = input.client;

      clientGuid = client.guid;
      accountGuid = client.account_use;

      chatBlastsPerformanceRec = input.chatBlastsPerformanceRec;


      currentAccount = _.find(client.accounts, {guid: client.account_use});

      switch (input.buttonId) {
        case 'BTN01':

          await LogProcessor.info({
            message: 'BTN01 pressed',
            clientGuid,
            accountGuid,
            location: moduleName,
            payload: {},
          });

          /**
           * Переводим клиента в воронку
           */

          currentAccount.keyboard = null;

          /**
           * Установить в client, что выполняется воронка "chatBlasts.testPersonal.pushToPaid.funnelOne"
           */

          client.current_funnel = 'chatBlasts.testPersonal.pushToPaid.funnelOne';

          const initialBlock = _.find(client.funnels[client.current_funnel],
            {initial: true});

          initialBlock.enabled = true;

          await sails.helpers.funnel.proceedNextBlockJoi({
            client,
            funnelName: client.current_funnel,
            blockId: "01",
            createdBy: moduleName,
          });

          /**
           * Устанавливаем флаг "done"
           */

          const ChatBlastsPerformanceUpdateCriteria = {
            guid: chatBlastsPerformanceRec.guid,
          };

          await ChatBlastsPerformance
            .updateOne(ChatBlastsPerformanceUpdateCriteria)
            .set({
              done: true
            })
            .tolerate(async (err) => {

              err.details = {
                ChatBlastsPerformanceUpdateCriteria,
              };

              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                location: moduleName,
                message: sails.config.custom.CHAT_BLASTS_ERROR_PERFORMANCE_REC_UPDATE_ERROR.message,
                errorName: sails.config.custom.CHAT_BLASTS_ERROR_PERFORMANCE_REC_UPDATE_ERROR.name,
                payload: {
                  ChatBlastsPerformanceUpdateCriteria,
                  chatBlastsPerformanceRec,
                  err,
                },
              });

              return 'error';
            });


          break;
        case 'BTN02':

          await LogProcessor.info({
            message: 'BTN02 pressed',
            clientGuid,
            accountGuid,
            location: moduleName,
            payload: {},
          });

          break;
        default:
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Wrong callback button id',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.PUSH_MESSAGES_ERROR.name,
            payload: {
              buttonId: input.buttonId,
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

