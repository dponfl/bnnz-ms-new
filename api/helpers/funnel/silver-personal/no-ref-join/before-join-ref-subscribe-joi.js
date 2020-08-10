"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:no-ref-join:before-join-ref-subscribe-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:no-ref-join:before-join-ref-subscribe-joi',


  description: 'funnel:silver-personal:no-ref-join:before-join-ref-subscribe-joi',


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
    let refUps;

    let clientGuid;
    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      let resHtml = input.payload.text;

      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      if (!currentAccount.is_ref) {

        currentAccount.is_ref = true;

        /**
         * "Прописываем" currentAccount в реферальную систему
         */

        const RefDataRaw = await sails.helpers.ref.linkAccountToRefJoi({
          account: currentAccount,
        });

        if (RefDataRaw.status !== 'ok') {
        //   throw new Error(`${moduleName}, error: wrong linkAccountToRefJoi response:
        // account: ${currentAccount}
        // RefDataRaw: ${JSON.stringify(RefDataRaw, null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Wrong linkAccountToRefJoi response',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR,
            payload: {
              currentAccount,
              RefDataRaw,
            },
          });

        }

        /**
         * Получаем список "аккаунт/профиль" для RefUp
         */

        refUps = RefDataRaw.payload.refUp;


      } else {

        /**
         * Аккаунт уже "прописан" в реферальной системе.
         * Получаем список "аккаунт/профиль" для него
         */

        const refUpGetCriteria = {
          account_guid: currentAccount.guid,
        };

        const refUpDataRaw = await sails.helpers.storage.refUpGetByCriteriaJoi({
          criteria: refUpGetCriteria,
        });

        if (refUpDataRaw.status !== 'ok') {
        //   throw new Error(`${moduleName}, error: wrong refUpGetByCriteria response:
        // criteria: ${refUpGetCriteria}
        // refUpDataRaw: ${JSON.stringify(refUpDataRaw, null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'Wrong refUpGetByCriteria response',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR,
            payload: {
              refUpGetCriteria,
              refUpDataRaw,
            },
          });

        }

        if (refUpDataRaw.payload.length === 0) {
        //   throw new Error(`${moduleName}, error: no refUp records found:
        // criteria: ${refUpGetCriteria}
        // refUpDataRaw.payload: ${JSON.stringify(refUpDataRaw.payload, null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.ERROR,
            location: moduleName,
            message: 'No refUp records found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR,
            payload: {
              refUpGetCriteria,
              refUpDataRawPayload: refUpDataRaw.payload,
            },
          });

        }

        refUps = refUpDataRaw.payload;

      }

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
        // throw new Error(`${moduleName}, error: accountGetJoi error response:
        //   params: ${JSON.stringify(refAccountRecRawParams, null, 3)}
        //   refAccountRecRaw: ${JSON.stringify(refAccountRecRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong accountGetJoi error response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR,
          payload: {
            refAccountRecRawParams,
            refAccountRecRaw,
          },
        });

      }

      if (refAccountRecRaw.payload.length === 0) {
        // throw new Error(`${moduleName}, error: no accounts found:
        //   params: ${JSON.stringify(refAccountRecRawParams, null, 3)}
        //   refAccountRecRaw: ${JSON.stringify(refAccountRecRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No accounts found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR,
          payload: {
            refAccountRecRawParams,
            refAccountRecRaw,
          },
        });

      }

      const refAccounts =  refAccountRecRaw.payload;

      for (const refAccountElem of refAccounts) {

        const pairElem = {
          accountGuid: refAccountElem.guid,
          instProfile: refAccountElem.inst_profile,
        };

        accountAndInstProfilePairs.push(pairElem);

      }

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
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
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

