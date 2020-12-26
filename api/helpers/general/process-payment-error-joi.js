"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'general:process-payment-error-joi';


module.exports = {


  friendlyName: 'general:process-payment-error-joi',


  description: 'general:process-payment-error-joi',


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
      paymentGroupGuid: Joi
        .string()
        .description('payment group guid')
        .guid()
        .required(),
      chatId: Joi
        .number()
        .description('client chat id')
        .positive()
        .required(),
      messenger: Joi
        .string()
        .description('messenger')
        .max(50)
        .valid(sails.config.custom.enums.messenger.TELEGRAM)
        .required(),
    });

    let input;

    let client = null;
    let paymentGroup = null;
    let paymentGroupGuid = null;

    let blockNameParseRes;
    let blockGroup;
    let blockId;
    let block;

    let clientGuid;
    let accountGuid;

    try {

      input = await schema.validateAsync(inputs.params);
      paymentGroupGuid = input.paymentGroupGuid;

      if (paymentGroupGuid === sails.config.custom.enums.dummyGuid) {

        /**
         * Кейс, когда pre_checkout_query не содержит msg.invoice_payload
         */

        /**
         * Достаём запись клиента
         */

        const clientRaw = await sails.helpers.storage.clientGetByCriteriaJoi({
          criteria: {
            chat_id: input.chatId,
            messenger: input.messenger,
          }
        });

        if (clientRaw.status !== 'ok') {
        //   throw new Error(`${moduleName}, error: client not found:
        // chat_id: ${input.chatId}
        // messenger: ${input.messenger}
        // client: ${JSON.stringify(clientRaw, null, 3)}`);
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'client not found',
            // clientGuid,
            // accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              chat_id: input.chatId,
              messenger: input.messenger,
              client: clientRaw,
            },
          });
        }
        if (clientRaw.payload.length !== 1) {
        //   throw new Error(`${moduleName}, error: several or none client records found:
        // chat_id: ${input.chatId}
        // messenger: ${input.messenger}
        // client: ${JSON.stringify(clientRaw.payload, null, 3)}`);
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'several or none client records found',
            // clientGuid,
            // accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              chat_id: input.chatId,
              messenger: input.messenger,
              client: clientRaw,
            },
          });
        }

        client = clientRaw.payload[0];

        clientGuid = client.guid;
        accountGuid = client.account_use;

        /**
         * Достаём наименования воронки и блока из paymentGroup записи
         */

        const paymentGroupRaw = await sails.helpers.storage.paymentGroupGetJoi({
          criteria: {
            client_guid: client.guid,
            messenger: input.messenger,
            type: sails.config.custom.enums.paymentGroupType.DEPOSIT,
            status: sails.config.custom.enums.paymentGroupStatus.PROCESSING,
          }
        });

        if (paymentGroupRaw.status !== 'ok') {
        //   throw new Error(`${moduleName}, error: payment group not found:
        // client_guid: ${client.guid}
        // messenger: ${input.messenger}
        // type: ${sails.config.custom.enums.paymentGroupType.DEPOSIT}
        // status: ${sails.config.custom.enums.paymentGroupStatus.PROCESSING}
        // paymentGroupRaw: ${JSON.stringify(paymentGroupRaw, null, 3)}`);
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'payment group not found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              messenger: input.messenger,
              type: sails.config.custom.enums.paymentGroupType.DEPOSIT,
              status: sails.config.custom.enums.paymentGroupStatus.PROCESSING,
              paymentGroupRaw,
            },
          });
        }
        if (paymentGroupRaw.payload.length !== 1) {
        //   throw new Error(`${moduleName}, error: several or none payment group records found:
        // client_guid: ${client.guid}
        // messenger: ${input.messenger}
        // type: ${sails.config.custom.enums.paymentGroupType.DEPOSIT}
        // status: ${sails.config.custom.enums.paymentGroupStatus.PROCESSING}
        // paymentGroupRaw: ${JSON.stringify(paymentGroupRaw.payload)}`)
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'several or none payment group records found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              messenger: input.messenger,
              type: sails.config.custom.enums.paymentGroupType.DEPOSIT,
              status: sails.config.custom.enums.paymentGroupStatus.PROCESSING,
              paymentGroupRaw,
            },
          });
        }

        paymentGroup = paymentGroupRaw.payload[0];

      }

      if (client == null) {

        /**
         * Достаём наименования воронки и блока из paymentGroup записи
         */

        const paymentGroupRaw = await sails.helpers.storage.paymentGroupGetJoi({
          criteria: {
            guid: paymentGroupGuid,
          }
        });

        if (paymentGroupRaw.status !== 'ok') {
        //   throw new Error(`${moduleName}, error: payment group not found:
        // guid: ${paymentGroupGuid}
        // paymentGroupRaw: ${JSON.stringify(paymentGroupRaw, null, 3)}`);
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'payment group not found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              paymentGroupGuid,
              paymentGroupRaw,
            },
          });
        }

        if (paymentGroupRaw.payload.length !== 1) {
        //   throw new Error(`${moduleName}, error: several or none payment group records found:
        // guid: ${paymentGroupGuid}
        // paymentGroupRaw: ${JSON.stringify(paymentGroupRaw.payload)}`)
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'several or none payment group records found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              paymentGroupGuid,
              paymentGroupRaw,
            },
          });
        }

        paymentGroup = paymentGroupRaw.payload[0];

        // const clientGuid = paymentGroup.clientGuid;

        /**
         * Достаём запись клиента
         */

        const clientRaw = await sails.helpers.storage.clientGetByCriteriaJoi({
          criteria: {
            guid: clientGuid,
          }
        });

        if (clientRaw.status !== 'ok') {
        //   throw new Error(`${moduleName}, error: client not found:
        // guid: ${clientGuid}
        // clientRaw: ${JSON.stringify(clientRaw, null, 3)}`);
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'client not found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              clientGuid,
              clientRaw,
            },
          });
        }

        if (clientRaw.payload.length !== 1) {
        //   throw new Error(`${moduleName}, error: several or none client records found:
        // guid: ${clientGuid}
        // clientRaw: ${JSON.stringify(clientRaw.payload)}`)
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'client not found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.GENERAL_ERROR.name,
            payload: {
              clientGuid,
              clientRaw,
            },
          });
        }

        client = clientRaw.payload[0];

      }

      /**
       * Устанавливаем paymentGroup запись в статус "error"
       */

      const updatedPaymentGroupRaw = await sails.helpers.storage.paymentGroupUpdateJoi({
        criteria: {
          guid: paymentGroup.guid,
        },
        data: {
          status: sails.config.custom.enums.paymentGroupStatus.ERROR,
        },
        createdBy: moduleName,
      });

      if (updatedPaymentGroupRaw.status !== 'ok') {
        // throw new Error(`${moduleName}, error: paymentGroup not updated:
        // guid: ${paymentGroup.guid}
        // updatedPaymentGroupRaw: ${JSON.stringify(updatedPaymentGroupRaw, null, 3)}`);
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'paymentGroup not updated',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            paymentGroupGuid: paymentGroup.guid,
            updatedPaymentGroupRaw,
          },
        });
      }


      /**
       * Используя наименование сервиса, воронки, блока и коллбэк-хелпера - формируем обращение
       * к хелперу, который долже обрабатывать эту платёжную ошибку
       */

      // const funnelName = client.funnel_name;

      blockNameParseRes = _.split(paymentGroup.funnel_block, sails.config.custom.JUNCTION, 2);
      blockGroup = blockNameParseRes[0];
      blockId = blockNameParseRes[1];

      if (blockGroup == null || blockId == null) {
        // throw new Error(`${moduleName}, error: cannot parse funnel block: ${paymentGroup.funnel_block}`);
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'paymentGroup.funnel_block parsing error',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            block: paymentGroup.funnel_block,
          },
        });
      }

      block = _.find(client.funnels[blockGroup], {id: blockId});

      if (block == null) {
        // throw new Error(`${moduleName}, error: funnel block not found:
        // updateFunnel: ${blockGroup}
        // updateId: ${blockId}
        // funnels[updateFunnel]: ${JSON.stringify(client.funnels[blockGroup], null, 3)}`);
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Block not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            blockGroup,
            blockId,
            funnel: client.funnels[blockGroup],
          },
        });
      }

      const helperNameRaw = block.callbackHelper;

      const callbackHelperParseRes = _.split(helperNameRaw, sails.config.custom.JUNCTION, 3);
      const callbackHelperCategory = callbackHelperParseRes[0];
      const callbackHelperGroup = callbackHelperParseRes[1];
      const callbackHelperName = callbackHelperParseRes[2];

      if (callbackHelperCategory == null
        || callbackHelperGroup == null
        || callbackHelperName == null
      ) {
        // throw new Error(`${moduleName}, error: cannot parse callbackHelper: ${helperNameRaw}`);
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Block parsing error',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.GENERAL_ERROR.name,
          payload: {
            helperNameRaw,
            callbackHelperParseRes,
            block,
          },
        });
      }

      const errorHelperName = `${callbackHelperName}OnPaymentErrorJoi`;

      /**
       * Вызываем хелпер обработки ошибки платежа
       */

      await sails.helpers.funnel[callbackHelperCategory][callbackHelperGroup][errorHelperName]({
        client,
        block,
        paymentGroup,
      });


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {
      //       error: e,
      //     },
      //   }
      // };

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
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};

