"use strict";

const Joi = require('@hapi/joi');

const moduleName = 'storage:message-save-joi';

module.exports = {


  friendlyName: 'Message save',


  description: 'Save all communication between client and bot',


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
      messageGuid: Joi
        .string()
        .description('message guid to find and update existing record')
        .guid(),
      message: Joi
        .any(),
      callbackQueryId: Joi
        .string()
        .max(255),
      messageId: Joi
        .string()
        .max(50),
      messageFormat: Joi
        .string()
        .max(255)
        .valid(
          sails.config.custom.enums.messageFormat.SIMPLE,
          sails.config.custom.enums.messageFormat.INLINEKEYBOARD,
          sails.config.custom.enums.messageFormat.KEYBOARD,
          sails.config.custom.enums.messageFormat.KEYBOARD_REMOVE,
          sails.config.custom.enums.messageFormat.FORCED,
          sails.config.custom.enums.messageFormat.IMG,
          sails.config.custom.enums.messageFormat.VIDEO,
          sails.config.custom.enums.messageFormat.STICKER,
          sails.config.custom.enums.messageFormat.DOC,
          sails.config.custom.enums.messageFormat.IMGINLINEKEYBOARD,
          sails.config.custom.enums.messageFormat.SEND_INVOICE,
          sails.config.custom.enums.messageFormat.DEL,
          sails.config.custom.enums.messageFormat.EDIT_RM,
          sails.config.custom.enums.messageFormat.EDIT_T,
          sails.config.custom.enums.messageFormat.POSTBROADCAST,
          sails.config.custom.enums.messageFormat.PUSHSIMPLE,
          sails.config.custom.enums.messageFormat.PUSHINLINEKEYBOARD,
          sails.config.custom.enums.messageFormat.PUSHIMGINLINEKEYBOARD,
          sails.config.custom.enums.messageFormat.PUSHVIDEOINLINEKEYBOARD,
          sails.config.custom.enums.messageFormat.PUSHFORCED,
          sails.config.custom.enums.messageFormat.PUSHIMG,
          sails.config.custom.enums.messageFormat.PUSHVIDEO,
          sails.config.custom.enums.messageFormat.PUSHSTICKER,
        ),
      channel: Joi
        .string()
        .max(50)
        .valid(sails.config.custom.enums.messenger.TELEGRAM),
      messageOriginator: Joi
        .string()
        .max(50)
        .valid(
          sails.config.custom.enums.messageOriginator.BOT,
          sails.config.custom.enums.messageOriginator.CLIENT,
        ),
      clientId: Joi
        .number()
        .integer(),
      clientGuid: Joi
        .string()
        .guid()
        .required(),
      accountGuid: Joi
        .string()
        .guid()
        .required(),
      action: Joi
        .string()
        .valid(
          sails.config.custom.enums.messageSaveActions.CREATE,
          sails.config.custom.enums.messageSaveActions.UPDATE,
        )
        .required(),
      createdBy: Joi
        .string()
        .description('source of update'),
    });

    let clientGuid;
    let accountGuid;

    let messageRec;

    let messageRecParams = {};

    let messageGuid;

    let createdBy;

    let input;

    try {

      input = await schema.validateAsync(inputs.params);

      clientGuid = input.clientGuid;
      accountGuid = input.accountGuid;

      createdBy = input.createdBy;

      switch (input.action) {
        case sails.config.custom.enums.messageSaveActions.CREATE:

          /**
           * При создании новой записи в input как мин должны присутствовать:
           * - clientId
           * - clientGuid
           * - accountGuid
           */

          if (_.isNil(input.clientId)) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
              location: moduleName,
              message: 'Missing "clientId" on record create',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
              payload: {
                input,
                createdBy,
              },
            });
          }

          /**
           * Создаём первоначальную запись
           */

          const getGuidRes = await sails.helpers.general.getGuid();
          messageGuid = getGuidRes.guid;

          _.assign(
            messageRecParams,
            _.omit(input, ['messageGuid', 'action']),
            {messageGuid},
          );

          messageRec = await Messages.create(messageRecParams)
            .fetch()
            .tolerate(async (err) => {

              err.details = {
                messageRecParams,
              };

              await LogProcessor.dbError({
                error: err,
                message: 'Messages.create() error',
                clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                location: moduleName,
                payload: {
                  messageRecParams,
                  createdBy,
                },
              });

              return null;
            });

          if (_.isNil(messageRec)) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
              location: moduleName,
              message: 'Messages.create() error',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
              payload: {
                messageRecParams,
                createdBy,
              },
            });
          }

          break;

        case sails.config.custom.enums.messageSaveActions.UPDATE:

          if (_.isNil(input.messageGuid)) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.MEDIUM,
              location: moduleName,
              message: 'Missing "messageGuid" on record update',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
              payload: {
                input,
                createdBy,
              },
            });
          }

          /**
           * Параметр:
           *  - clientId
           *  - clientGuid
           *  - accountGuid
           * были сохранены при создании записи поэтому удаляем эти
           * данные из вх параметров для избеания ошибок перезаписи
           */

          messageRecParams = _.omit(input, ['clientId', 'clientGuid', 'accountGuid', 'action']);

          /**
           * Редактируем данные записи по messageGuid
           */

          messageGuid = input.messageGuid;

          messageRec = await Messages.findOne({messageGuid})
            .tolerate(async (err) => {

              err.details = {
                messageGuid,
              };

              await LogProcessor.dbError({
                error: err,
                message: 'Messages.findOne() error',
                clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                location: moduleName,
                payload: {
                  messageGuid,
                  createdBy,
                },
              });

              return null;
            });

          if (_.isNil(messageRec)) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
              location: moduleName,
              message: 'No message record by "messageGuid"',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
              payload: {
                messageGuid,
                createdBy,
              },
            });
          }

          messageRec = await Messages.updateOne({messageGuid})
            .set(messageRecParams)
            .tolerate(async (err) => {

              err.details = {
                messageGuid,
                messageRecParams,
              };

              await LogProcessor.dbError({
                error: err,
                message: 'Messages.updateOne() error',
                clientGuid,
                accountGuid,
                // requestId: null,
                // childRequestId: null,
                location: moduleName,
                payload: {
                  messageGuid,
                  messageRecParams,
                  createdBy,
                },
              });

              return null;
            });

          if (_.isNil(messageRec)) {
            await sails.helpers.general.throwErrorJoi({
              errorType: sails.config.custom.enums.errorType.CRITICAL,
              emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
              location: moduleName,
              message: 'No record data returned from Messages.updateOne()',
              clientGuid,
              accountGuid,
              errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
              payload: {
                messageGuid,
                messageRecParams,
                createdBy,
              },
            });
          }

          break;

      }

      return exits.success({
        status: 'success',
        message: 'Message record created',
        payload: messageRec,
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
          errorPayloadAdditional: {
            createdBy,
            input,
          },
        });
      } else {
        await sails.helpers.general.catchErrorJoi({
          clientGuid,
          accountGuid,
          error: e,
          location: moduleName,
          throwError: false,
          errorPayloadAdditional: {
            createdBy,
            input,
          },
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

