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
          throw new Error(`${moduleName}, error: client not found:
        chat_id: ${input.chatId}
        messenger: ${input.messenger}
        client: ${JSON.stringify(clientRaw, null, 3)}`);
        }
        if (clientRaw.payload.length !== 1) {
          throw new Error(`${moduleName}, error: several or none client records found:
        chat_id: ${input.chatId}
        messenger: ${input.messenger}
        client: ${JSON.stringify(clientRaw.payload, null, 3)}`);
        }

        client = clientRaw.payload[0];

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
          throw new Error(`${moduleName}, error: payment group not found:
        client_guid: ${client.guid}
        messenger: ${input.messenger}
        type: ${sails.config.custom.enums.paymentGroupType.DEPOSIT}
        status: ${sails.config.custom.enums.paymentGroupStatus.PROCESSING}
        paymentGroupRaw: ${JSON.stringify(paymentGroupRaw, null, 3)}`);
        }
        if (paymentGroupRaw.payload.length !== 1) {
          throw new Error(`${moduleName}, error: several or none payment group records found:
        client_guid: ${client.guid}
        messenger: ${input.messenger}
        type: ${sails.config.custom.enums.paymentGroupType.DEPOSIT}
        status: ${sails.config.custom.enums.paymentGroupStatus.PROCESSING}
        paymentGroupRaw: ${JSON.stringify(paymentGroupRaw.payload)}`)
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
          throw new Error(`${moduleName}, error: payment group not found:
        guid: ${paymentGroupGuid}
        paymentGroupRaw: ${JSON.stringify(paymentGroupRaw, null, 3)}`);
        }
        if (paymentGroupRaw.payload.length !== 1) {
          throw new Error(`${moduleName}, error: several or none payment group records found:
        guid: ${paymentGroupGuid}
        paymentGroupRaw: ${JSON.stringify(paymentGroupRaw.payload)}`)
        }

        paymentGroup = paymentGroupRaw.payload[0];

        const clientGuid = paymentGroup.clientGuid;

        /**
         * Достаём запись клиента
         */

        const clientRaw = await sails.helpers.storage.clientGetByCriteriaJoi({
          criteria: {
            guid: clientGuid,
          }
        });

        if (clientRaw.status !== 'ok') {
          throw new Error(`${moduleName}, error: client not found:
        guid: ${clientGuid}
        clientRaw: ${JSON.stringify(clientRaw, null, 3)}`);
        }
        if (clientRaw.payload.length !== 1) {
          throw new Error(`${moduleName}, error: several or none client records found:
        guid: ${clientGuid}
        clientRaw: ${JSON.stringify(clientRaw.payload)}`)
        }

        client = clientRaw.payload[0];

      }


      /**
       * Используя наименование сервиса, воронки, блока и коллбэк-хелпера - формируем обращение
       * к хелперу, который долже обрабатывать эту платёжную ошибку
       */

      const funnelName = client.funnel_name;

      blockNameParseRes = _.split(paymentGroup.funnel_block, sails.config.custom.JUNCTION, 2);
      blockGroup = blockNameParseRes[0];
      blockId = blockNameParseRes[1];

      if (blockGroup == null || blockId == null) {
        throw new Error(`${moduleName}, error: cannot parse funnel block: ${paymentGroup.funnel_block}`);
      }

      block = _.find(client.funnels[blockGroup], {id: blockId});

      if (block == null) {
        throw new Error(`${moduleName}, error: funnel block not found:
        updateFunnel: ${blockGroup}
        updateId: ${blockId}
        funnels[updateFunnel]: ${JSON.stringify(client.funnels[blockGroup], null, 3)}`);
      }

      const helperNameRaw = block.callbackHelper;

      const callbackHelperParseRes = _.split(helperNameRaw, sails.config.custom.JUNCTION, 2);
      const callbackHelperGroup = callbackHelperParseRes[0];
      const callbackHelperName = callbackHelperParseRes[1];

      if (callbackHelperGroup == null || callbackHelperName == null) {
        throw new Error(`${moduleName}, error: cannot parse callbackHelper: ${helperNameRaw}`);
      }

      const errorHelperName = `${callbackHelperName}OnPaymentErrorJoi`;

      /**
       * Вызываем хелпер обработки ошибки платежа
       */

      await sails.helpers.funnel[funnelName][callbackHelperGroup][errorHelperName]({
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

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
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

