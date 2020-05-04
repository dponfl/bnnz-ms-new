"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver_personal:optin:after-wrong-profile';


module.exports = {


  friendlyName: 'funnel:silver_personal:optin:after-wrong-profile',


  description: 'funnel:silver_personal:optin:after-wrong-profile',


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

    try {

      input = await schema.validateAsync(inputs.params);

      let getProfileBlock;

      let splitRes = _.split(input.block.previous, sails.config.custom.JUNCTION, 2);
      let nextFunnel = splitRes[0];
      let nextId = splitRes[1];


      getProfileBlock = _.find(input.client.funnels[nextFunnel], {id: nextId});

      if (getProfileBlock) {
        getProfileBlock.shown = false;
        getProfileBlock.done = false;
        getProfileBlock.next = null;

      } else {
        throw new Error(`${moduleName}, error: wrong block.previous: \n${input.block.previous}`);
      }

      await sails.helpers.funnel.afterHelperGenericJoi({
        client: input.client,
        block: input.block,
        msg: input.msg,
        next: true,
        previous: false,  // if we do not set it to false then previous block is set done=true
                          // and we will not be able to move to it again (but we want to move there
        switchFunnel: true,
        createdBy: moduleName,
      });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
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

