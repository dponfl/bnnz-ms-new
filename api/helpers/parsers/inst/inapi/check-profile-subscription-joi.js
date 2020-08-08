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

    let clientGuid;
    let accountGuid;

    let result;
    let notSubscribed = [];
    let subscribed = [];
    let allSubscribed = false;
    let requestDepth = 0;

    const platform = 'Instagram';
    const action = 'parsing';
    const api = 'inapi';
    const requestType = 'checkProfileSubscription';
    const momentStart = moment();

    let status = '';

    try {

      const input = await schema.validateAsync(inputs.params);

      const client = input.client;
      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


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

        requestDepth = checkSteps[i];

        getFollowingsJoiRes = await sails.helpers.parsers.inst.inapi.getFollowingsJoi(getFollowingsJoiParams);

        if (getFollowingsJoiRes.status !== 'success') {

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
            comments: {
              error: 'wrong getFollowingsJoi response status',
              response: getFollowingsJoiRes.raw || {},
            },
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          await LogProcessor.error({
            message: sails.config.custom.INST_PARSER_WRONG_GET_FOLLOWINGS_STATUS.message,
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_WRONG_GET_FOLLOWINGS_STATUS.name,
            location: moduleName,
            payload: getFollowingsJoiRes,
          });


          return exits.success({
            status: 'error',
            message: `${moduleName} performed with error`,
            payload: {
              error: 'wrong getFollowingsJoi response status',
            },
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

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
      //
      // await LogProcessor.error({
      //   message: e.message || errorMsg,
      //   clientGuid,
      //   accountGuid,
      //   // requestId: null,
      //   // childRequestId: null,
      //   errorName: e.name || 'none',
      //   location: errorLocation,
      //   payload: e.raw || {},
      // });
      //
      // return exits.success({
      //   status: 'error',
      //   module: errorLocation,
      //   message: errorMsg,
      //   payload: {
      //     error: e.raw || {},
      //   },
      // })

      return await sails.helpers.general.catchErrorJoi({
        error: e,
        location: moduleName,
        throwError: false,
      });


    }

  }

};

