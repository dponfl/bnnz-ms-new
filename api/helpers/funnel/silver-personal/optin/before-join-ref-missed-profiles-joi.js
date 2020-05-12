"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:optin:before-join-ref-missed-profiles-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:optin:before-join-ref-missed-profiles-joi',


  description: 'funnel:silver-personal:optin:before-join-ref-missed-profiles-joi',


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


      /**
       * Получаем список "аккаунт/профиль" на которые не была сделана подписка
       */

      const accountAndInstProfilePairs = [];
      const accountGuids = [];

      const refUpGetJoiParams = {
        criteria: {
          account_guid: currentAccount.guid,
          signed: false,
        },
      };

      const refUpRecsRaw = await sails.helpers.storage.refUpGetJoi(refUpGetJoiParams);

      if (refUpRecsRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: wrong refUpGetJoi response:
        refUpGetJoiParams: ${JSON.stringify(refUpGetJoiParams, null, 3)}
        refUpRecsRaw: ${JSON.stringify(refUpRecsRaw, null, 3)}`);
      }

      _.forEach(refUpRecsRaw.payload, (refUpElem) => {
        accountGuids.push(refUpElem.ref_account_guid);
      });

      const accountGetJoiParams = {
        accountGuids,
      };

      const refAccountRecRaw = await sails.helpers.storage.accountGetJoi(accountGetJoiParams);

      if (refAccountRecRaw.status !== 'ok') {
        throw new Error(`${moduleName}, error: accountGetJoi error response:
          params: ${JSON.stringify(accountGetJoiParams, null, 3)}
          refAccountRecRaw: ${JSON.stringify(refAccountRecRaw, null, 3)}`);
      }

      if (refAccountRecRaw.payload.length === 0) {
        throw new Error(`${moduleName}, error: no accounts found:
          params: ${JSON.stringify(accountGetJoiParams, null, 3)}
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

      let refProfilesList = '';

      for (const refListElem of accountAndInstProfilePairs) {
        refProfilesList = refProfilesList + `<a href="${sails.config.custom.config.general.instagram_prefix}${refListElem.instProfile}">${refListElem.instProfile}</a>${sails.config.custom.SCR}`;
      }

      refProfilesList = refProfilesList + sails.config.custom.SCR;

      resHtml = _.replace(resHtml, '$RefMissedProfilesList$', refProfilesList);

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

