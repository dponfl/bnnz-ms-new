"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:account-fields-put-joi';


module.exports = {


  friendlyName: 'Save data at AccountFields table',


  description: 'Save data at AccountFields table',


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
      accountGuid: Joi
        .string()
        .description('accountGuid')
        .guid()
        .required(),
      data: Joi
        .any()
        .description('Data to save')
        .required(),
      createdBy: Joi
        .string()
        .description('source of update')
        .required(),
    });

    let input;

    let accountGuid;


    try {

      input = await schema.validateAsync(inputs.params);

      accountGuid = input.accountGuid;


      const accountFieldsData = _.pick(input.data, [
        'guid',
        'subscription_active',
        'subscription_from',
        'subscription_until',
        'service',
        'payment_plan',
        'payment_made',
        'next_subscription_from',
        'next_subscription_until',
        'next_service',
        'next_payment_plan',
        'next_payment_made',
        'deleted',
        'inst_profile',
        'inst_id',
        'inst_pic',
        'posts_made_day',
        'posts_received_day',
        'posts_made_total',
        'posts_received_total',
        'requested_likes_day',
        'made_likes_day',
        'requested_comments_day',
        'requested_likes_total',
        'made_likes_total',
        'requested_comments_total',
        'made_comments_total',
        'made_comments_day',
        'profile_provided',
        'profile_confirmed',
        'payment_plan_selected',
        'subscription_confirmed_by_client',
        'subscription_made',
        'service_subscription_finalized',
        'client',
      ]);

      // if (accountFieldsData.service) {
      //   accountFieldsData.service = accountFieldsData.service.id;
      // }
      //
      // if (accountFieldsData.next_service) {
      //   accountFieldsData.next_service = accountFieldsData.next_service.id;
      // }

      const accountRec = await Account.findOne({
        guid: input.accountGuid
      });

      if (!accountRec) {
        // throw new Error(`No account record found for the conditions provided, input.accountGuid: ${input.accountGuid}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No account record found for accountGuid',
          accountGuid,
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            accountGuid: input.accountGuid,
          },
        });

      }

      _.forEach(accountFieldsData, async (accountFieldValue, accountFieldKey) => {

        try {
          if (accountRec[accountFieldKey] !== accountFieldValue) {

            const accountFieldRec = {
              account_guid: input.accountGuid,
              field: accountFieldKey,
              old_value: _.toString(accountRec[accountFieldKey]),
              new_value: _.toString(accountFieldValue),
              created_by: `${input.createdBy} => ${moduleName}`,
            };

            await AccountFields.create(accountFieldRec);

          }
        } catch (ee) {
          const throwError = true;
          if (throwError) {
            return await sails.helpers.general.catchErrorJoi({
              error: ee,
              location: moduleName,
              throwError: true,
              errorPayloadAdditional: {
                accountGuid: input.accountGuid,
              },
            });
          } else {
            await sails.helpers.general.catchErrorJoi({
              error: ee,
              location: moduleName,
              throwError: false,
              errorPayloadAdditional: {
                accountGuid: input.accountGuid,
              },
            });
            return exits.success({
              status: 'ok',
              message: `${moduleName} performed`,
              payload: {},
            });
          }
        }
      });

      return exits.success({
        status: 'ok',
        message: 'AccountFields record created',
        payload: {
          accountGuid: input.accountGuid,
          data: input.data
        },
      })

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: ${sails.config.custom.ACCOUNTFIELDSPUT_ERROR}`;
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
          errorPayloadAdditional: {
            accountGuid: input.accountGuid,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            accountGuid: input.accountGuid,
          },
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

