"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:generic:options:callback-get-personal-joi';


module.exports = {


  friendlyName: 'funnel:generic:options:callback-get-personal-joi',


  description: 'funnel:generic:options:callback-get-personal-joi',


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
      query: Joi
        .any()
        .description('Callback query received')
        .required(),
    });

    let input;

    let clientGuid;
    let accountGuid;


    let nextBlockActivationGenericParams;


    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const currentAccount = _.find(input.client.accounts, {guid: input.client.account_use});

      switch (input.query.data) {
        case 'check_befree_p':

          nextBlockActivationGenericParams = {
            client: input.client,
            account: currentAccount,
            block: input.block,
            updateElement: 'next',
            updateElementValue: 'options::befree_p_info_01',
            updateElementPreviousValue: 'options::get_personal',
            createdBy: moduleName,
            msg: input.msg,
          };

          await sails.helpers.funnel.nextBlockActivationGenericJoi(nextBlockActivationGenericParams);

          break;
        case 'check_belike':

          nextBlockActivationGenericParams = {
            client: input.client,
            account: currentAccount,
            block: input.block,
            updateElement: 'next',
            updateElementValue: 'options::belike_info_01',
            updateElementPreviousValue: 'options::get_personal',
            createdBy: moduleName,
            msg: input.msg,
          };

          await sails.helpers.funnel.nextBlockActivationGenericJoi(nextBlockActivationGenericParams);

          break;
        case 'check_behero':

          nextBlockActivationGenericParams = {
            client: input.client,
            account: currentAccount,
            block: input.block,
            updateElement: 'next',
            updateElementValue: 'options::behero_info_01',
            updateElementPreviousValue: 'options::get_personal',
            createdBy: moduleName,
            msg: input.msg,
          };

          await sails.helpers.funnel.nextBlockActivationGenericJoi(nextBlockActivationGenericParams);

          break;
        case 'check_bestar':

          nextBlockActivationGenericParams = {
            client: input.client,
            account: currentAccount,
            block: input.block,
            updateElement: 'next',
            updateElementValue: 'options::bestar_info_01',
            updateElementPreviousValue: 'options::get_personal',
            createdBy: moduleName,
            msg: input.msg,
          };

          await sails.helpers.funnel.nextBlockActivationGenericJoi(nextBlockActivationGenericParams);

          break;
        case 'check_belegend':

          nextBlockActivationGenericParams = {
            client: input.client,
            account: currentAccount,
            block: input.block,
            updateElement: 'next',
            updateElementValue: 'options::belegend_info_01',
            updateElementPreviousValue: 'options::get_personal',
            createdBy: moduleName,
            msg: input.msg,
          };

          await sails.helpers.funnel.nextBlockActivationGenericJoi(nextBlockActivationGenericParams);

          break;
        default:
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Wrong callback data',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            payload: {
              inputQueryData: input.query.data,
            },
          });
      }

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      const throwError = true;
      if (throwError) {
        return await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: true,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            clientGuid,
            accountGuid,
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

