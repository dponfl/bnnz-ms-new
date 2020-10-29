"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'parsers:inst:rapid-api-logicbuilder:check-profile-subscription-joi';


module.exports = {

  friendlyName: 'parsers:inst:rapid-api-logicbuilder:check-profile-subscription-joi',


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

    let clientGuid;
    let accountGuid;

    let result;
    let notSubscribed = [];
    let subscribed = [];
    let allSubscribed = false;
    const followingProfiles = [];
    let getFollowingsJoiRes;
    let totalFollowing = 0;
    let checkedProfiles = 0;

    let hasMore = true;
    let endCursor = null;

    const platform = 'Instagram';
    const action = 'parsing';
    const api = 'rapidApiLogicbuilder';
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


      while (!allSubscribed && hasMore) {

        const getFollowingsJoiParams = {
          client,
          instProfile: input.checkProfile,
        };

        if (endCursor != null) {
          getFollowingsJoiParams.endCursor = endCursor;
        }


        getFollowingsJoiRes = await sails.helpers.parsers.inst.rapidApiLogicbuilder.getFollowingsJoi(getFollowingsJoiParams);

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

        /**
         * Случай, когда указанный профиль не найден
         */

        if (getFollowingsJoiRes.subStatus === sails.config.custom.HTTP_STATUS_NOT_FOUND.message) {

          status = 'error';
          const momentDone = moment();

          const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

          await LogProcessor.error({
            message: sails.config.custom.INST_PARSER_PROFILE_NOT_EXISTS.message,
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.INST_PARSER_PROFILE_NOT_EXISTS.name,
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
              error: sails.config.custom.INST_PARSER_PROFILE_NOT_EXISTS.message,
              getFollowingsJoiParams: _.omit(getFollowingsJoiParams, 'client'),
              getFollowingsJoiRes,
            },
          };

          await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

          return exits.success({
            status: 'error',
            message: `${moduleName} performed with error`,
            payload: {
              error: sails.config.custom.INST_PARSER_PROFILE_NOT_EXISTS.message,
              checkRenewIndex: 0,
            },
            raw: getFollowingsJoiRes,
          })

        }

        totalFollowing = getFollowingsJoiRes.payload.count;
        checkedProfiles = checkedProfiles + getFollowingsJoiRes.payload.users.length;

        _.forEach(getFollowingsJoiRes.payload.users, (elem) => {
          followingProfiles.push(elem.username)
        });

        notSubscribed = _.difference(input.profilesList, followingProfiles);

        allSubscribed = notSubscribed.length === 0;

        hasMore = getFollowingsJoiRes.payload.has_more || false;
        endCursor = getFollowingsJoiRes.payload.end_cursor || null;

        if (endCursor == null) {
          hasMore = false;
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
          totalFollowing,
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
          status: 'error',
          message: `${moduleName} performed`,
          payload: {},
        });
      }
    }

  }

};

