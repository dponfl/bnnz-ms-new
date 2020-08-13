"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment');

const moduleName = 'parsers:inst:inapi:check-likes-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:check-likes-joi',


  description: 'Проверка постановки лайка',


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
      instProfile: Joi.string()
        .required(),
      instPostCode: Joi.string()
        .required(),
    });

    let clientGuid;
    let accountGuid;


    let likeMade = false;

    const platform = 'Instagram';
    const action = 'parsing';
    const api = 'inapi';
    const requestType = 'checkLikes';
    const momentStart = moment();

    let status = '';

    try {

      const input = await schema.validateAsync(inputs.params);

      const client = input.client;
      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      /**
       * Получаем mediaId поста
       */

      const getMediaIdParams = {
        client,
        shortCode: input.instPostCode,
      };

      const getMediaIdRaw = await sails.helpers.parsers.inst.inapi.getMediaIdJoi(getMediaIdParams);

      if (getMediaIdRaw.status !== 'success') {

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_WRONG_GET_MEDIA_ID_STATUS.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_WRONG_GET_MEDIA_ID_STATUS.name,
          location: moduleName,
          payload: getMediaIdRaw,
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
            error: 'wrong getMediaIdJoi response status',
            response: getMediaIdRaw.raw || {},
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'wrong getMediaIdJoi response status',
          },
          raw: getMediaIdRaw,
        })

      }

      const mediaId = _.get(getMediaIdRaw, 'payload.mediaId', null);

      if (mediaId == null) {

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_WRONG_GET_MEDIA_ID_RESPONSE.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_WRONG_GET_MEDIA_ID_RESPONSE.name,
          location: moduleName,
          payload: getMediaIdRaw,
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
            error: 'wrong getMediaIdJoi response: no payload.mediaId',
            response: getMediaIdRaw.raw || {},
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'wrong getMediaIdJoi response: no payload.mediaId',
          },
          raw: getMediaIdRaw,
        })

      }

      /**
       * Получаем данные о тех, кто поставил лайк
       */

      const getLikesParams = {
        client,
        mediaId,
      };

      const getLikesJoiRaw = await sails.helpers.parsers.inst.inapi.getLikesJoi(getLikesParams);

      if (getLikesJoiRaw.status !== 'success') {

        status = 'error';
        const momentDone = moment();

        const requestDuration = moment.duration(momentDone.diff(momentStart)).asMilliseconds();

        await LogProcessor.error({
          message: sails.config.custom.INST_PARSER_WRONG_GET_LIKES_STATUS.message,
          clientGuid,
          accountGuid,
          // requestId: null,
          // childRequestId: null,
          errorName: sails.config.custom.INST_PARSER_WRONG_GET_LIKES_STATUS.name,
          location: moduleName,
          payload: getLikesJoiRaw,
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
            error: 'wrong getLikesJoi response status',
            response: getLikesJoiRaw.raw || {},
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {
            error: 'wrong getLikesJoi response status',
          },
          raw: getLikesJoiRaw,
        })

      }

      const likeByProfile = _.find(getLikesJoiRaw.payload.users, {username: input.instProfile});

      if (likeByProfile != null) {
        likeMade = true;
      }

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
          likeMade,
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: {
          likeMade,
        },
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

      // return await sails.helpers.general.catchErrorJoi({
      //   error: e,
      //   location: moduleName,
      //   throwError: false,
      // });

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
          status: 'ok',
          message: `${moduleName} performed`,
          payload: {},
        });
      }

    }

  }

};

