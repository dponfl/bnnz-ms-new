"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'funnel:star:optin:callback-confirm-profile-joi';


module.exports = {


  friendlyName: 'funnel:star:optin:callback-confirm-profile-joi',


  description: 'funnel:star:optin:callback-confirm-profile-joi',


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
      block: Joi
        .any()
        .description('Current funnel block')
        .required(),
      query: Joi
        .any()
        .description('Callback query received')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      switch (input.query.data) {
        case 'profile_confirm_yes':
          input.client.accounts[currentAccountInd].inst_profile = input.client.inst_profile_tmp;
          input.client.inst_profile_tmp = null;
          input.client.accounts[currentAccountInd].profile_confirmed = true;
          input.block.next = 'optin::optin_completed';

          await linkToRef(input.client);

          await updateDataAndAllocateRooms(input.client);

          break;
        case 'profile_confirm_no':
          input.client.inst_profile_tmp = null;
          input.client.accounts[currentAccountInd].profile_provided = false;
          input.block.next = 'optin::try_again';
          break;
        default:
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Wrong callback data',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              inputQueryData: input.query.data,
            },
          });
      }

      input.block.done = true;

      await sails.helpers.funnel.afterHelperGenericJoi({
        client: input.client,
        block: input.block,
        msg: input.query,
        next: true,
        previous: true,
        switchFunnel: true,
        createdBy: moduleName,
      });

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

async function linkToRef(client) {

  const methodName = 'linkToRef';

  const clientGuid = client.guid;
  const accountGuid = client.account_use;

  const currentAccount = _.find(client.accounts, {guid: client.account_use});

  if (!currentAccount.is_ref) {

    currentAccount.is_ref = true;

    /**
     * "Прописываем" currentAccount в реферальную систему
     */

    const RefDataRaw = await sails.helpers.ref.linkAccountToRefJoi({
      account: currentAccount,
    });

    if (RefDataRaw.status !== 'ok') {
      await sails.helpers.general.throwErrorJoi({
        errorType: sails.config.custom.enums.errorType.ERROR,
        location: `${moduleName}::${methodName}`,
        message: 'Wrong linkAccountToRefJoi response',
        clientGuid,
        accountGuid,
        errorName: sails.config.custom.FUNNELS_ERROR.name,
        payload: {
          currentAccount,
          RefDataRaw,
        },
      });
    }

  }

}

async function updateDataAndAllocateRooms(client) {

  const methodName = 'updateDataAndAllocateRooms';

  const clientGuid = client.guid;
  const accountGuid = client.account_use;

  const currentAccount = _.find(client.accounts, {guid: client.account_use});
  const currentRegion = currentAccount.region;
  const currentServiceName = currentAccount.service.name;

  const currentAccountInd = _.findIndex(client.accounts, (o) => {
    return o.guid === currentAccount.guid;
  });

  const useLang = (_.has(sails.config.custom.config.lang, client.lang) ? client.lang : 'ru');

  const priceConfigText = sails.config.custom.config.lang[useLang].price;
  const priceConfigGeneral = sails.config.custom.config.price;

  if (priceConfigText == null) {
    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.CRITICAL,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: `${moduleName}::${methodName}`,
      message: 'No text price config found (missing config.lang[useLang].price)',
      clientGuid,
      accountGuid,
      errorName: sails.config.custom.FUNNELS_ERROR.name,
      payload: {
        useLang,
      },
    });
  }

  if (priceConfigGeneral == null) {
    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.CRITICAL,
      emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
      location: `${moduleName}::${methodName}`,
      message: 'No text price config found (missing config.price)',
      clientGuid,
      accountGuid,
      errorName: sails.config.custom.FUNNELS_ERROR.name,
      payload: {},
    });
  }

  const currentAmount = priceConfigGeneral[currentRegion][currentServiceName].period_01.current_price;
  const currentCurrency = priceConfigGeneral[currentRegion].currency;

  /**
   * Обновляем поля записи текущего аккаунта
   */

  client.accounts[currentAccountInd].payment_made = true;
  client.accounts[currentAccountInd].subscription_from = moment()
    .format();
  client.accounts[currentAccountInd].subscription_until = moment()
    .add(priceConfigGeneral.payment_periods.period_01.value, priceConfigGeneral.payment_periods.period_01.period)
    .format();

  client.accounts[currentAccountInd].payment_amount = currentAmount;
  client.accounts[currentAccountInd].payment_currency = currentCurrency;

  /**
   * Прописываем клиента в комнаты
   */

  const reallocateRoomsToAccountJoiParams = {
    account: currentAccount,
  };

  const reallocateRoomsToAccountJoiRaw = await sails.helpers.general.reallocateRoomsToAccountJoi(reallocateRoomsToAccountJoiParams);

  if (reallocateRoomsToAccountJoiRaw.status !== 'ok') {
    await sails.helpers.general.throwErrorJoi({
      errorType: sails.config.custom.enums.errorType.ERROR,
      location: `${moduleName}::${methodName}`,
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

}

