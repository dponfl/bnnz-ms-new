"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');
const sleep = require('util').promisify(setTimeout);

const moduleName = 'parsers:inst:rapid-api-socialminer:check-profile-subscription-joi';


module.exports = {

  friendlyName: 'parsers:inst:rapid-api-socialminer:check-profile-subscription-joi',


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
      checkRenewIndex: Joi
        .number()
        .description('index to define depth on check renew')
        .integer(),
    });

    let client;
    let clientGuid;
    let accountGuid;

    let result;
    let notSubscribed = [];
    let subscribed = [];
    let allSubscribed = false;
    const followingProfiles = [];
    let getFollowingsJoiRes;
    let checkedProfiles = 0;

    let hasNextPage = true;
    let endCursor = null;

    const platform = 'Instagram';
    const action = 'parsing';
    const api = 'rapidApiSocialminer';
    const requestType = 'checkProfileSubscription';
    const momentStart = moment();

    let status = '';

    try {

      const input = await schema.validateAsync(inputs.params);

      client = input.client;
      clientGuid = client.guid;
      accountGuid = client.account_use;

      const requestTimeout = sails.config.custom.config.parsers.inst.rapidApiSocialminer.requestTimeout || null;

      /**
       * Проверяем подписку парсером постепенно увеличивая глубину проверки, если
       * подписка всё ещё не подтверждена
       */


      while (!allSubscribed && hasNextPage) {

        const getFollowingsJoiParams = {
          client,
          userId: input.profileId,
        };

        if (endCursor != null) {
          getFollowingsJoiParams.endCursor = endCursor;
        }

        getFollowingsJoiRes = await sails.helpers.parsers.inst.rapidApiSocialminer.getFollowingsJoi(getFollowingsJoiParams);

        if (getFollowingsJoiRes.status !== 'success') {

          status = 'error';
          const momentDone = moment();

          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          await LogProcessor.error({
            message: sails.config.custom.INST_PARSER_WRONG_GET_FOLLOWINGS_STATUS.message,
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_WRONG_GET_FOLLOWINGS_STATUS.name,
            location: moduleName,
            payload: {
              getFollowingsJoiParams: _.omit(getFollowingsJoiParams, 'client'),
              getFollowingsJoiRes,
            }
          });

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
              getFollowingsJoiParams: _.omit(getFollowingsJoiParams, 'client'),
              getFollowingsJoiRes,
            },
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          return exits.success({
            status: 'error',
            message: `${moduleName} performed with error`,
            payload: {
              error: 'wrong getFollowingsJoi response status',
              checkRenewIndex: 0,
            },
            raw: getFollowingsJoiRes,
          })

        }

        checkedProfiles = checkedProfiles + getFollowingsJoiRes.payload.users.length;

        // _.forEach(getFollowingsJoiRes.payload.users, (elem) => {
        //   if (!_.isNil(elem.username)) {
        //     followingProfiles.push(elem.username)
        //   }
        // });

        for (const elem of getFollowingsJoiRes.payload.users) {
          if (!_.isNil(elem.node.username)) {
            followingProfiles.push(elem.node.username)
          }
        }

        notSubscribed = _.difference(input.profilesList, followingProfiles);

        allSubscribed = notSubscribed.length === 0;

        hasNextPage = getFollowingsJoiRes.payload.hasNextPage || false;
        endCursor = getFollowingsJoiRes.payload.endCursor || null;

        if (endCursor == null) {
          hasNextPage = false;
        }

        if (!_.isNil(requestTimeout)) {
          await sleep(requestTimeout);
        }

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
        status,
        clientGuid,
        accountGuid,
        comments: {
          input: _.omit(input, 'client'),
          result,
          checkedProfiles,
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: result,
      })


    } catch (e) {
      const throwError = false;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError: true,
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError: false,
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

