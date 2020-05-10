"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:before-join-ref-subscribe-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:before-join-ref-subscribe-joi',


  description: 'funnel:silver-personal:optin:before-join-ref-subscribe-joi',


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
      payload: Joi
        .any()
        .description('{text, inline_keyboard} object')
        .required(),
      msg: Joi
        .any()
        .description('Message received'),
    });

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      let resHtml = input.payload.text;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});
      const currentAccountInd = _.findIndex(input.client.accounts, (o) => {
        return o.guid === currentAccount.guid;
      });

      currentAccount.is_ref = true;

      // input.client.accounts[currentAccountInd].is_ref = true;

      /**
       * "Прописываем" currentAccount в реферальную систему
       */

      const RefDataRaw = await sails.helpers.ref.linkAccountToRefJoi({
        account: currentAccount,
      });

      if (RefDataRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong linkAccountToRefJoi response:
        account: ${currentAccount}
        RefDataRaw: ${JSON.stringify(RefDataRaw, null, 3)}`);
      }

      /**
       * Получаем список "аккаунт/профиль" для RefUp
       */

      const refUps = RefDataRaw.payload.refUp;
      const accountAndInstProfilePairs = [];
      const accountGuids = [];

      for (const refUpElem of refUps) {
        accountGuids.push(refUpElem.ref_account_guid);
      }

      const refAccountRecRawParams = {
        accountGuids,
      };

      const refAccountRecRaw = await sails.helpers.storage.accountGetJoi(refAccountRecRawParams);

      if (refAccountRecRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: accountGetJoi error response:
          params: ${JSON.stringify(refAccountRecRawParams, null, 3)}
          refAccountRecRaw: ${JSON.stringify(refAccountRecRaw, null, 3)}`);
      }

      if (refAccountRecRaw.payload.length === 0) {
        throw new Error(`${moduleName}, error: no accounts found:
          params: ${JSON.stringify(refAccountRecRawParams, null, 3)}
          refAccountRecRaw: ${JSON.stringify(refAccountRecRaw, null, 3)}`);
      }

      const refAccounts =  refAccountRecRaw.payload;

      for (const refAccountElem of refAccounts) {

        const pairElem = {
          accountGuid: refAccountElem.guid,
          instProfile: refAccountElem.inst_profile,
        };

        accountAndInstProfilePairs.push(pairElem);

      }

      currentAccount.ref_list = accountAndInstProfilePairs;

      // await sails.helpers.storage.accountUpdateJoi({
      //   criteria: {
      //     guid: currentAccount.guid,
      //   },
      //   data: {
      //     ref_list: accountAndInstProfilePairs,
      //   },
      // });

      let refProfilesList = '';

      for (const refListElem of accountAndInstProfilePairs) {
        refProfilesList = refProfilesList + `<a href="${sails.config.custom.config.general.instagram_prefix}${refListElem.instProfile}">${refListElem.instProfile}</a>${sails.config.custom.SCR}`;
      }

      refProfilesList = refProfilesList + sails.config.custom.SCR;

      resHtml = _.replace(resHtml, '$RefProfilesList$', refProfilesList);

      return exits.success({
        text: resHtml,
        inline_keyboard: input.payload.inline_keyboard,
      });

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

