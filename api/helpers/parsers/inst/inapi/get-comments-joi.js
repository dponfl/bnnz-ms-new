"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');
const moment = require('moment');

const moduleName = 'parsers:inst:inapi:get-comments-joi';


module.exports = {


  friendlyName: 'parsers:inst:inapi:get-comments-joi',


  description: 'Получение информации о тех, кто оставил комментарий и текста комментария',


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
      mediaId: Joi
        .string()
        .description('Instagram media id')
        .required(),
    });


    try {

      const input = await schema.validateAsync(inputs.params);

      const clientGuid = input.client.guid;
      const accountGuid = input.client.account_use;

      const platform = 'Instagram';
      const action = 'parsing';
      const api = 'inapi';
      const requestType = 'getComments';
      let status = '';

      const momentStart = moment();

      const options = {
        uri: sails.config.custom.instParserUrl + sails.config.custom.config.parsers.inst[sails.config.custom.config.parsers.inst.activeParserName].paths.getComments,
        method: 'GET',
        qs: {
          api_key: sails.config.custom.instParserApiKey,
          mediaId: input.mediaId,
        },
        json: true,
      };

      const requestRes = await rp(options);

      const responseStatusMain = _.get(requestRes, 'status', null);
      const responseStatusInner = _.get(requestRes, 'response.status', null);

      if (responseStatusMain !== 'success' || responseStatusInner !== 'success') {
        // throw new Error(`${moduleName}, error => wrong parser response:
        // request params: ${JSON.stringify(options, null, 3)}
        // request response: ${JSON.stringify(requestRes, null, 3)}`);

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
            responseStatusMain,
            responseStatusInner,
            request_id: _.get(requestRes, 'request_id', null),
            requestParams: _.omit(options, 'qs.api_key'),
            rawResponse: requestRes,
          },
        };

        await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

        return exits.success({
          status: 'error',
          message: `${moduleName} performed with error`,
          payload: {},
          raw: requestRes,
        })

      }

      const comments = _.get(requestRes, 'response.instagram.comments', null);

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
          responseStatusMain,
          responseStatusInner,
          request_id: _.get(requestRes, 'request_id', null),
        },
      };

      await sails.helpers.storage.performanceCreateJoi(performanceCreateParams);

      return exits.success({
        status: 'success',
        message: `${moduleName} performed`,
        payload: {
          comments
        },
        raw: requestRes,
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

