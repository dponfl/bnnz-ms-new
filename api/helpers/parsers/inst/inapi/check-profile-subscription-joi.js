"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'parsers:inst:inapi:check-profile-subscription-joi';


module.exports = {

  friendlyName: 'parsers:inst:inapi:check-profile-subscription-joi',


  description: 'Проверка, что один профиль подписан на другие профили',


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
      checkProfile: Joi
        .string()
        .description('Instagram profile to check subscription')
        .required(),
      profileId: Joi
        .string()
        .description('Instagram profile ID')
        .required(),
      profilesList: Joi
        .any()
        .description('list of Instagram profile to check subscription on')
        .required(),
    });

    let result;
    let notSubscribed = [];
    let subscribed = [];
    let allSubscribed = false;

    const platform = 'Instagram';
    const action = 'parsing';
    const api = 'inapi';
    const requestType = 'getFollowings';
    const momentStart = moment();

    try {

      const input = await schema.validateAsync(inputs.params);

      const client = input.client;
      const clientGuid = input.client.guid;
      const accountGuid = input.client.account_use;

      const platform = 'Instagram';
      const action = 'parsing';
      const api = 'inapi';
      const requestType = 'checkProfileSubscription';
      let status = '';

      const momentStart = moment();

      /**
       * Проверяем подписку парсером постепенно увеличивая глубину проверки, если
       * подписка всё ещё не подтверждена
       */

      let getFollowingsJoiRes;

      const checkSteps = sails.config.custom.config.parsers.inst.checkSteps.getFollowing;

      let i = 0;

      while (!allSubscribed && i < checkSteps.length) {

        const getFollowingsJoiParams = {
          client,
          profilePk: input.profileId,
          limit: checkSteps[i],
        };

        getFollowingsJoiRes = await sails.helpers.parsers.inst.inapi.getFollowingsJoi(getFollowingsJoiParams);

        if (getFollowingsJoiRes.status !== 'success') {
          // throw new Error(`${moduleName}, error: wrong getFollowingsJoi response
          // getFollowingsJoiParams: ${JSON.stringify(getFollowingsJoiParams, null, 3)}
          // getFollowingsJoiRes: ${JSON.stringify(getFollowingsJoiRes, null, 3)}`);

          status = 'error';
          const momentDone = moment();

          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          const performanceCreateParams = {
            platform,
            action,
            api,
            requestType,
            requestDuration,
            status,
            clientGuid,
            accountGuid,
            comments: getFollowingsJoiRes.raw || {},
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          return exits.success({
            status: 'error',
            message: `${moduleName} performed with error`,
            payload: {},
            raw: getFollowingsJoiRes,
          })

        }

        const followingProfiles = [];

        _.forEach(getFollowingsJoiRes.payload.users, (elem) => {
          followingProfiles.push(elem.username)
        });

        notSubscribed = _.difference(input.profilesList, followingProfiles);

        allSubscribed = notSubscribed.length === 0;

        i++;

      }

      subscribed = _.difference(input.profilesList, notSubscribed);

      result = {
        allSubscribed,
        notSubscribed,
        subscribed,
      };

      status = 'success';

      const momentDone = moment();

      const requestDepth = checkSteps[i];
      const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

      const performanceCreateParams = {
        platform,
        action,
        api,
        requestType,
        requestDuration,
        requestDepth,
        status,
        clientGuid,
        accountGuid,
        // comments: getFollowingsJoiRes.raw || {},
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: result,
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

