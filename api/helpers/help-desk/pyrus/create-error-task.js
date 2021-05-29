"use strict";

const Joi = require('@hapi/joi');
const rp = require('request-promise');
const errors = require('request-promise/errors');

const moduleName = 'api:helpers:help-desk:pyrus:create-error-task';


module.exports = {


  friendlyName: 'api:helpers:help-desk:pyrus:create-error-task',


  description: 'api:helpers:help-desk:pyrus:create-error-task',


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
      microService: Joi
        .string()
        .description('microservice name')
        .required(),
      errorName: Joi
        .string()
        .description('errorName'),
      message: Joi
        .string()
        .description('message')
        .required(),
      clientGuid: Joi
        .string()
        .description('client guid')
        .guid(),
      accountGuid: Joi
        .string()
        .description('account guid')
        .guid(),
      requestId: Joi
        .string()
        .description('requestId')
        .guid(),
      childRequestId: Joi
        .string()
        .description('childRequestId')
        .guid(),
      location: Joi
        .string()
        .description('location'),
    });

    let input;

    let microService;
    let errorName;
    let message;
    let clientGuid;
    let accountGuid;
    let requestId;
    let childRequestId;
    let location;

    let requestError;

    try {

      input = await schema.validateAsync(inputs.params);

      microService = input.microService;
      errorName = input.errorName || null;
      message = input.message;
      clientGuid = input.clientGuid || null;
      accountGuid = input.accountGuid || null;
      requestId = input.requestId || null;
      childRequestId = input.childRequestId || null;
      location = input.location || null;


      const fields = [];

      fields.push({
        id: sails.config.custom.config.serviceDesk.pyrus.forms.error.microService.id,
        value: microService
      })

      if (!_.isNil(errorName)) {
        fields.push({
          id: sails.config.custom.config.serviceDesk.pyrus.forms.error.errorName.id,
          value: errorName
        })
      }

      fields.push({
        id: sails.config.custom.config.serviceDesk.pyrus.forms.error.message.id,
        value: message
      })

      if (!_.isNil(clientGuid)) {
        fields.push({
          id: sails.config.custom.config.serviceDesk.pyrus.forms.error.clientGuid.id,
          value: clientGuid
        })
      }

      if (!_.isNil(accountGuid)) {
        fields.push({
          id: sails.config.custom.config.serviceDesk.pyrus.forms.error.accountGuid.id,
          value: accountGuid
        })
      }

      if (!_.isNil(requestId)) {
        fields.push({
          id: sails.config.custom.config.serviceDesk.pyrus.forms.error.requestId.id,
          value: requestId
        })
      }

      if (!_.isNil(childRequestId)) {
        fields.push({
          id: sails.config.custom.config.serviceDesk.pyrus.forms.error.childRequestId.id,
          value: childRequestId
        })
      }

      if (!_.isNil(location)) {
        fields.push({
          id: sails.config.custom.config.serviceDesk.pyrus.forms.error.location.id,
          value: location
        })
      }

      const formId = sails.config.custom.config.serviceDesk.pyrus.forms.error.formId;

      const baseUrl = sails.config.custom.config.serviceDesk.pyrus.baseUrl;
      const apiAction = sails.config.custom.config.serviceDesk.pyrus.actions.tasks;
      const accessToken = sails.config.custom.config.serviceDesk.pyrus.accessToken;

      const requestParams = {
        form_id: formId,
        fields,
      };


      const options = {
        method: 'POST',
        uri: `${baseUrl}/${apiAction}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: requestParams,
        json: true,
      };


      const requestRes = await rp(options)
        .catch(errors.StatusCodeError, async (reason) => {
          // The server responded with a status codes other than 2xx.
          // Check reason.statusCode

          await LogProcessor.error({
            message: 'Http server responded with a status codes other than 2xx',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: 'Wrong http response status code',
            location: moduleName,
            payload: reason,
            useHelpDeskLogger: false,
          });

          requestError = {
            status: 'error',
            subStatus: 'StatusCodeError',
            message: `${moduleName} performed with error`,
            payload: reason,
          };

        })
        .catch(errors.RequestError, async (reason) => {
          // The request failed due to technical reasons.
          // reason.cause is the Error object Request would pass into a callback.

          await LogProcessor.error({
            message: 'Http request failed due to technical reasons',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: 'Wrong http request response',
            location: moduleName,
            payload: reason,
            useHelpDeskLogger: false,
          });

          requestError = {
            status: 'error',
            subStatus: 'RequestError',
            message: `${moduleName} performed with error`,
            payload: {
              name: reason.name,
              message: reason.message,
              cause: reason.cause,
            },
          };

        });

      if (requestError) {
        return exits.success({
          status: 'error',
          message: `${moduleName} performed with http error`,
          payload: {
            requestError,
          },
        });
      }


      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {requestRes},
      })

    } catch (e) {

      const throwError = true;
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
          message: `${moduleName} not performed`,
          payload: {},
        });
      }

    }

  }

};

