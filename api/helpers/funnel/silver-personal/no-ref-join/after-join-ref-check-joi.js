"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:no-ref-join:after-join-ref-check-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:no-ref-join:after-join-ref-check-joi',


  description: 'funnel:silver-personal:no-ref-join:after-join-ref-check-joi',


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
      msg: Joi
        .any()
        .description('Message received'),
    });

    let input;

    let clientGuid;
    let accountGuid;


    try {

      let updateBlock;
      let getBlock;
      let splitRes;
      let updateFunnel;
      let updateId;


      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      /**
       * формируем список профилей для проверки подписки на них
       */

      const refUpGetJoiParams = {
        criteria: {
          account_guid: currentAccount.guid,
          signed: false,
        },
      };

      const refUpRecsRaw = await sails.helpers.storage.refUpGetJoi(refUpGetJoiParams);

      if (refUpRecsRaw.status !== 'ok') {
        // throw new Error(`${moduleName}, error: wrong refUpGetJoi response:
        // refUpGetJoiParams: ${JSON.stringify(refUpGetJoiParams, null, 3)}
        // refUpRecsRaw: ${JSON.stringify(refUpRecsRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong refUpGetJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            refUpGetJoiParams,
            refUpRecsRaw,
          },
        });

      }

      const refUpGuids = [];

      _.forEach(refUpRecsRaw.payload, (refUpElem) => {
        refUpGuids.push(refUpElem.ref_account_guid);
      });

      const accountGetJoiParams = {
        accountGuids: refUpGuids,
      };

      const refAccountRecRaw = await sails.helpers.storage.accountGetJoi(accountGetJoiParams);

      if (refAccountRecRaw.status !== 'ok') {
        // throw new Error(`${moduleName}, error: wrong accountGetJoi response:
        // accountGetJoiParams: ${JSON.stringify(accountGetJoiParams, null, 3)}
        // refAccountRecRaw: ${JSON.stringify(refAccountRecRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong accountGetJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            accountGetJoiParams,
            refAccountRecRaw,
          },
        });

      }

      if (refAccountRecRaw.payload.length !== refUpGuids.length) {
        // throw new Error(`${moduleName}, error: wrong amount of records found:
        // accountGetJoiParams: ${JSON.stringify(accountGetJoiParams, null, 3)}
        // refAccountRecRaw: ${JSON.stringify(refAccountRecRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong amount of records found',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            accountGetJoiParams,
            refAccountRecRaw,
          },
        });

      }

      const profilesList = [];

      _.forEach(refAccountRecRaw.payload, (elem) => {
        profilesList.push(elem.inst_profile);
      });

      const flag = profilesList.length < 2 ? 0 : _.random(0, 3);

      const checkProfileSubscriptionParams = {
        checkProfile: currentAccount.inst_profile,
        profileId: currentAccount.inst_id,
        profilesList,
      };

      const checkProfileSubscriptionResRaw = await sails.helpers.parsers.inst[sails.config.custom.config.parsers.inst.activeParserName].checkProfileSubscriptionJoi(checkProfileSubscriptionParams);

      if (checkProfileSubscriptionResRaw.status !== 'ok') {
        // throw new Error(`${moduleName}, error: wrong checkProfileSubscriptionJoi response:
        // checkProfileSubscriptionParams: ${JSON.stringify(checkProfileSubscriptionParams, null, 3)}
        // checkProfileSubscriptionResRaw: ${JSON.stringify(checkProfileSubscriptionResRaw, null, 3)}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'Wrong checkProfileSubscriptionJoi response',
          clientGuid,
          accountGuid,
          errorName: sails.config.custom.FUNNELS_ERROR.name,
          payload: {
            checkProfileSubscriptionParams,
            checkProfileSubscriptionResRaw,
          },
        });

      }

      const checkProfileSubscriptionRes = checkProfileSubscriptionResRaw.payload;

      /**
       * устанавливаем в RefUp статус signed для аккаунтов профилей, на которые осуществлена подписка
       */

      if (checkProfileSubscriptionRes.subscribed.length > 0) {

        const signedAccountGuid = [];

        _.forEach(checkProfileSubscriptionRes.subscribed, (profile) => {

          const refListRec = _.find(refAccountRecRaw.payload, {inst_profile: profile});

          if (refListRec) {
            signedAccountGuid.push(refListRec.guid);
          }

        });

        await sails.helpers.storage.refUpUpdateJoi({
          criteria: {
            account_guid: currentAccount.guid,
            ref_account_guid: signedAccountGuid,
          },
          data: {
            signed: true,
          },
          createdBy: moduleName,
        });

      }

      if (checkProfileSubscriptionRes.allSubscribed) {

        /**
         * Подписка на все профили была выполнена
         */

        input.block.next = 'noRefJoin::join_ref_done';
        input.block.done = true;
        input.block.shown = true;

        /**
         * Update input.block.next block
         */

        updateBlock = input.block.next;

        splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
        updateFunnel = splitRes[0];
        updateId = splitRes[1];

        if (_.isNil(updateFunnel)
          || _.isNil(updateId)
        ) {
          // throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block parsing error',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              block: input.block,
              nextBlock: input.block.next,
            },
          });

        }

        getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

        if (getBlock) {
          getBlock.shown = false;
          getBlock.done = false;
          getBlock.previous = 'noRefJoin::join_ref_check';
        } else {
          // throw new Error(`${moduleName}, error: block not found:
          //    updateBlock: ${updateBlock}
          //    updateFunnel: ${updateFunnel}
          //    updateId: ${updateId}
          //    input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block not found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              updateId,
              updateFunnel,
              funnel: input.client.funnels[updateFunnel],
            },
          });

        }

        /**
         * Update 'noRefJoin::join_ref_missed_profiles' block
         */

        updateBlock = 'noRefJoin::join_ref_missed_profiles';

        splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
        updateFunnel = splitRes[0];
        updateId = splitRes[1];

        if (_.isNil(updateFunnel)
          || _.isNil(updateId)
        ) {
          // throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block parsing error',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              updateBlock,
            },
          });

        }

        getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

        if (getBlock) {
          getBlock.shown = true;
          getBlock.done = true;
          getBlock.previous = 'noRefJoin::join_ref_check';
        } else {
          // throw new Error(`${moduleName}, error: block not found:
          //    updateBlock: ${updateBlock}
          //    updateFunnel: ${updateFunnel}
          //    updateId: ${updateId}
          //    input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block not found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              updateId,
              updateFunnel,
              funnel: input.client.funnels[updateFunnel],
            },
          });

        }


        await sails.helpers.funnel.afterHelperGenericJoi({
          client: input.client,
          block: input.block,
          msg: input.msg,
          next: true,
          previous: true,
          switchFunnel: true,
          createdBy: moduleName,
        });


      } else {

        /**
         * Подписка была выполнена НЕ на все профили
         */

        input.block.next = 'noRefJoin::join_ref_missed_profiles';
        input.block.done = true;
        input.block.shown = true;

        /**
         * Update input.block.next block
         */

        updateBlock = input.block.next;

        splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
        updateFunnel = splitRes[0];
        updateId = splitRes[1];

        if (_.isNil(updateFunnel)
          || _.isNil(updateId)
        ) {
          // throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block parsing error',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              block: input.block,
              updateBlock,
            },
          });

        }

        getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

        if (getBlock) {
          getBlock.shown = false;
          getBlock.done = false;
          getBlock.previous = 'noRefJoin::join_ref_check';
          getBlock.next = null;
        } else {
          // throw new Error(`${moduleName}, error: block not found:
          //    updateBlock: ${updateBlock}
          //    updateFunnel: ${updateFunnel}
          //    updateId: ${updateId}
          //    input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block not found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              updateBlock,
              updateFunnel,
              funnel: input.client.funnels[updateFunnel],
            },
          });

        }

        await sails.helpers.funnel.afterHelperGenericJoi({
          client: input.client,
          block: input.block,
          msg: input.msg,
          next: true,
          previous: false,
          switchFunnel: true,
          createdBy: moduleName,
        });


      }


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

