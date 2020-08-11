"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'funnel:silver-personal:main:forced-provide-post-link-joi';


module.exports = {


  friendlyName: 'funnel:silver-personal:main:forced-provide-post-link-joi',


  description: 'funnel:silver-personal:main:forced-provide-post-link-joi',


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

    let clientGuid;
    let accountGuid;


    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;


      const enteredPostLink = _.trim(input.msg.text);

      if (enteredPostLink.match(RegExp(sails.config.custom.config.general.instagram_post_prefix))) {

        /**
         * Entered post looks ok
         */

        const generateTasksResult = await sails.helpers.tasks.generateTasksJoi({
          client: input.client,
          postLink: enteredPostLink,
        });

        if (generateTasksResult.status === 'ok') {

          input.block.done = true;
          input.block.next = 'main::post_performed';

          /**
           * Update next block
           */

          updateBlock = input.block.next;

          splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
          updateFunnel = splitRes[0];
          updateId = splitRes[1];

          if (_.isNil(updateFunnel)
            || _.isNil(updateId)
          ) {
            // throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Block parsing error',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR,
              payload: {
                block: input.block,
                nextBlock: input.block.next,
              },
            });

          }

          getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

          if (getBlock) {
            getBlock.shown = false;
            getBlock.done = false;
            getBlock.previous = 'main::provide_post_link';
          } else {
            // throw new Error(`${moduleName}, error: block not found:
            //  updateBlock: ${updateBlock}
            //  updateFunnel: ${updateFunnel}
            //  updateId: ${updateId}
            //  input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);

            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Block not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR,
              payload: {
                updateId,
                updateFunnel,
                funnel: input.client.funnels[updateFunnel]              },
            });

          }

        } else {

          // TODO: Заменить на нормальное логирование ошибки
          sails.log.error(`Wrong reply from sails.helpers.tasks.generateTasks: ${JSON.stringify(generateTasksResult, null, 3)}`);
        }

      } else {

        input.block.done = true;
        input.block.next = 'main::wrong_post_link';

        /**
         * Update next block
         */

        updateBlock = input.block.next;

        splitRes = _.split(updateBlock, sails.config.custom.JUNCTION, 2);
        updateFunnel = splitRes[0];
        updateId = splitRes[1];

        if (_.isNil(updateFunnel)
          || _.isNil(updateId)
        ) {
          // throw new Error(`${moduleName}, error: parsing error of ${updateBlock}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block parsing error',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR,
            payload: {
              block: input.block,
              nextBlock: input.block.next,
            },
          });

        }

        getBlock = _.find(input.client.funnels[updateFunnel], {id: updateId});

        if (getBlock) {
          getBlock.shown = false;
          getBlock.done = false;
          getBlock.previous = 'main::provide_post_link';
        } else {
          // throw new Error(`${moduleName}, error: block not found:
          //    updateBlock: ${updateBlock}
          //    updateFunnel: ${updateFunnel}
          //    updateId: ${updateId}
          //    input.client.funnels[updateFunnel]: ${JSON.stringify(input.client.funnels[updateFunnel], null, 3)}`);

          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block not found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR,
            payload: {
              updateId,
              updateFunnel,
              funnel: input.client.funnels[updateFunnel]              },
          });

        }

      }

      await sails.helpers.funnel.afterHelperGenericJoi({
        client: input.client,
        block: input.block,
        msg: input.msg,
        next: true,
        previous: true,
        switchFunnel: true,
        createdBy: moduleName,
      });

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {},
      })

    } catch (e) {

      // const errorLocation = moduleName;
      // const errorMsg = `${moduleName}: General error`;
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

