"use strict";

const Joi = require('@hapi/joi');
const sleep = require('util').promisify(setTimeout);

const moduleName = 'funnel:common:main:forced-provide-post-link-joi';


module.exports = {


  friendlyName: 'funnel:common:main:forced-provide-post-link-joi',


  description: 'funnel:common:main:forced-provide-post-link-joi',


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

    let parserStatus = '';
    let parserSubStatus = '';
    const parserRequestIntervals = sails.config.custom.config.parsers.inst.errorSteps.getPostMetadata.intervals;
    const parserRequestIntervalTime = sails.config.custom.config.parsers.inst.errorSteps.intervalTime;

    let activeParser = null;
    const parserPlatformName = 'instagram';
    const parserModuleName = 'getPostMetadata';

    let getMediaIdRaw = null;

    let updateBlock;
    let getBlock;
    let splitRes;
    let updateFunnel;
    let updateId;

    try {

      input = await schema.validateAsync(inputs.params);

      const client = input.client;

      clientGuid = input.client.guid;
      accountGuid = input.client.account_use;

      input.block.done = false;
      input.block.shown = false;
      input.block.next = null;
      input.block.previous = null;


      const enteredPostLink = _.trim(input.msg.text);

      if (enteredPostLink.match(RegExp(sails.config.custom.postRegExp))) {

        /**
         * Entered post looks ok
         */

        /**
         * Получаем mediaId поста
         */

        /**
         * Получаем имя парсера
         */

        const getParserParams = {
          platformName: parserPlatformName,
          moduleName: parserModuleName,
        };

        activeParser = await sails.helpers.parsers.getParserJoi(getParserParams);

        const instPostCode = await sails.helpers.general.getPostCodeJoi({postLink: enteredPostLink});


        const getMediaIdParams = {
          client,
          shortCode: instPostCode,
        };

        let i = 0;

        while (parserStatus !== 'success' && i < parserRequestIntervals.length) {

          if (activeParser != null) {

            getMediaIdRaw = await sails.helpers.parsers.inst[activeParser].getPostMetadataJoi(getMediaIdParams);

            parserStatus = getMediaIdRaw.status;

          } else {

            parserStatus = 'error';

          }

          if (parserStatus !== 'success') {

            if (activeParser != null) {

              /**
               * выставляем флаг, что парсер неактивен
               */

              const apiStatusUpdateParams = {
                platformName: parserPlatformName,
                moduleName: parserModuleName,
                parserName: activeParser,
                data: {
                  key: 'active',
                  value: false,
                },
                createdBy: moduleName,
              };

              await sails.helpers.storage.apiStatusUpdateJoi(apiStatusUpdateParams);

            }

            await sleep(parserRequestIntervals[i] * parserRequestIntervalTime);

            activeParser = await sails.helpers.parsers.getParserJoi(getParserParams);

          }

          i++;
        }


        if (parserStatus === 'success') {

          parserSubStatus = getMediaIdRaw.subStatus;

          const mediaId = _.get(getMediaIdRaw, 'payload.mediaId', null);

          if (mediaId == null
            || parserSubStatus === sails.config.custom.HTTP_STATUS_NOT_FOUND.message
          ) {

            /**
             * пост не найден парсером
             */

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
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                location: moduleName,
                message: 'Block parsing error',
                clientGuid,
                accountGuid,
                errorName: sails.config.custom.FUNNELS_ERROR.name,
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
              await sails.helpers.general.throwErrorJoi({
                errorType: sails.config.custom.enums.errorType.CRITICAL,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                location: moduleName,
                message: 'Block not found',
                clientGuid,
                accountGuid,
                errorName: sails.config.custom.FUNNELS_ERROR.name,
                payload: {
                  updateId,
                  updateFunnel,
                  funnel: input.client.funnels[updateFunnel]              },
              });
            }

          } else {

            const generateTasksParams = {
              client: input.client,
              postLink: enteredPostLink,
              shortCode: instPostCode,
              mediaId,
            };

            const generateTasksResult = await sails.helpers.tasks.generateTasksJoi(generateTasksParams);

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
                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                  location: moduleName,
                  message: 'Block parsing error',
                  clientGuid,
                  accountGuid,
                  errorName: sails.config.custom.FUNNELS_ERROR.name,
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
                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                  location: moduleName,
                  message: 'Block not found',
                  clientGuid,
                  accountGuid,
                  errorName: sails.config.custom.FUNNELS_ERROR.name,
                  payload: {
                    updateId,
                    updateFunnel,
                    funnel: input.client.funnels[updateFunnel]              },
                });
              }

            } else {
              await LogProcessor.critical({
                message: 'Wrong reply from sails.helpers.tasks.generateTasks',
                clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                errorName: sails.config.custom.FUNNELS_ERROR.name,
                emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                location: moduleName,
                payload: {
                  generateTasksParams: _.omit(generateTasksParams, 'client'),
                  generateTasksResult
                },
              });

              /**
               * для движения по воронке - отправляем сообщение об успешной отправке поста
               */

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
                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                  location: moduleName,
                  message: 'Block parsing error',
                  clientGuid,
                  accountGuid,
                  errorName: sails.config.custom.FUNNELS_ERROR.name,
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
                await sails.helpers.general.throwErrorJoi({
                  errorType: sails.config.custom.enums.errorType.CRITICAL,
                  emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
                  location: moduleName,
                  message: 'Block not found',
                  clientGuid,
                  accountGuid,
                  errorName: sails.config.custom.FUNNELS_ERROR.name,
                  payload: {
                    updateId,
                    updateFunnel,
                    funnel: input.client.funnels[updateFunnel]              },
                });
              }
            }

          }

        } else {

          /**
           * Успешный ответ от парсера так и не был получен:
           * - информируем админа
           * - создаём отложенную задачу
           * - двигаем клиента по воронке
           */

          /**
           * информируем админа
           */

          await LogProcessor.critical({
            message: 'Adequate parser response for getPostMetadata was not received',
            clientGuid,
            accountGuid,
            // requestId: null,
            // childRequestId: null,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
            location: moduleName,
            payload: {
              postLink: enteredPostLink,
              getMediaIdParams: _.omit(getMediaIdParams, 'client'),
              getMediaIdRaw,
            },
          });


          /**
           * создаём отложенную задачу
           */

          const pendingActionsCreateParams = {
            clientGuid,
            accountGuid,
            pendingActionName: sails.config.custom.enums.pendingActionsNames.GET_MEDIA_ID,
            actionsPerformed: 1,
            payload: {
              postLink: enteredPostLink,
              getMediaIdParams: _.omit(getMediaIdParams, 'client'),
            },
          };

          const pendingActionsCreateRaw = await sails.helpers.storage.pendingActionsCreateJoi(pendingActionsCreateParams);

          if (pendingActionsCreateRaw.status == null || pendingActionsCreateRaw.status !== 'ok') {
            await LogProcessor.critical({
              message: 'PendingAction record create error',
              clientGuid,
              accountGuid,
              // requestId: null,
              // childRequestId: null,
              errorName: sails.config.custom.STORAGE_ERROR.name,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
              location: moduleName,
              payload: {
                pendingActionsCreateParams,
                pendingActionsCreateRaw,
              },
            });
          }


          /**
           * двигаем клиента по воронке
           */

          input.block.done = true;
          input.block.next = 'main::wrong_parser_response';

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
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Block parsing error',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
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
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
              location: moduleName,
              message: 'Block not found',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.FUNNELS_ERROR.name,
              payload: {
                updateId,
                updateFunnel,
                funnel: input.client.funnels[updateFunnel]              },
            });
          }

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
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block parsing error',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
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
          await sails.helpers.general.throwErrorJoi({
            errorType: sails.config.custom.enums.errorType.CRITICAL,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.LOW,
            location: moduleName,
            message: 'Block not found',
            clientGuid,
            accountGuid,
            errorName: sails.config.custom.FUNNELS_ERROR.name,
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

