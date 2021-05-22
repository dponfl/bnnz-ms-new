"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'funnel:chat-blasts:test-personal-push-to-paid:callback-bestar-make-payment-joi-on-payment-success-joi';


module.exports = {


  friendlyName: 'funnel:chat-blasts:test-personal-push-to-paid:callback-bestar-make-payment-joi-on-payment-success-joi',


  description: 'funnel:chat-blasts:test-personal-push-to-paid:callback-bestar-make-payment-joi-on-payment-success-joi',


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
        .description('client record')
        .required(),
      block: Joi
        .any()
        .description('funnel block initiated the payment process')
        .required(),
      paymentGroup: Joi
        .any()
        .description('paymentGroup record')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;

    const currentServiceName = sails.config.custom.enums.serviceNames.goldPersonal;

    let splitRes;
    let updateFunnel;
    let updateId;
    let getBlock;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      const previousServiceName = currentAccount.service.name;

      /**
       * Обновляем поля записи текущего аккаунта
       */

      const getServiceRes = await sails.helpers.storage.getService.with({serviceName: currentServiceName});

      if (getServiceRes.status == null
        || getServiceRes.status !== 'ok'
        || getServiceRes.payload == null
      ) {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Unexpected getService response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            serviceName: currentServiceName,
          },
        });
      }

      input.client.accounts[currentAccountInd].service = getServiceRes.payload;

      const priceConfig = sails.config.custom.config.price;

      input.client.accounts[currentAccountInd].payment_made = true;
      input.client.accounts[currentAccountInd].subscription_from = moment()
        .format();
      input.client.accounts[currentAccountInd].subscription_until = moment()
        .add(priceConfig.payment_periods.period_01.value, priceConfig.payment_periods.period_01.period)
        .format();

      /**
       * Обновляем данные клиента
       * для сохранения важных изменений п оаккаунту
       */

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: input.client.guid},
        data: input.client,
        createdBy: moduleName,
      });

      /**
       * Прописываем клиента в комнаты
       */

      const reallocateRoomsToAccountJoiParams = {
        account: currentAccount,
        previousServiceName,
      };

      const reallocateRoomsToAccountJoiRaw = await sails.helpers.general.reallocateRoomsToAccountJoi(reallocateRoomsToAccountJoiParams);

      if (reallocateRoomsToAccountJoiRaw.status !== 'ok') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong reallocateRoomsToAccountJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            reallocateRoomsToAccountJoiParams,
            reallocateRoomsToAccountJoiRaw,
          },
        });
      }

      /**
       * Устанавливаем значение для следующего блока
       */

      input.block.next = 'chatBlasts.testPersonal.pushToPaid.funnelOne::bestar_payment_success';

      /**
       * Устанавливае у следующего блока значение для предшествующего блока
       */

      splitRes = _.split(input.block.next, sails.config.custom.JUNCTION, 2);
      updateFunnel = splitRes[0];
      updateId = splitRes[1];


      getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

      if (getBlock) {
        getBlock.previous = 'chatBlasts.testPersonal.pushToPaid.funnelOne::bestar_make_payment';
        getBlock.enabled = true;
      }

      await sails.helpers.storage.clientUpdateJoi({
        criteria: {guid: input.client.guid},
        data: input.client,
        createdBy: moduleName,
      });

      /**
       * Try to find the initial block of the current funnel
       */

      let initialBlock = _.find(input.client.funnels[input.client.current_funnel],
        {initial: true});

      /**
       * Check that the initial block was found
       */

      if (!_.isNil(initialBlock) && !_.isNil(initialBlock.id)) {

        await sails.helpers.funnel.proceedNextBlockJoi({
          client: input.client,
          funnelName: input.client.current_funnel,
          blockId: initialBlock.id,
          createdBy: moduleName,
        });

      } else {

        /**
         * Throw error -> initial block was not found
         */

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
          location: moduleName,
          message: 'Initial block not found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            currentFunnelName: input.client.current_funnel,
            currentFunnel: input.client.funnels[input.client.current_funnel],
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
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
        });
        return exits.success({
          status: 'ok',
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};

