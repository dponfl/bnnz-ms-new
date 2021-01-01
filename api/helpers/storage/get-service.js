"use strict";

const moduleName = 'storage:get-service';

module.exports = {


  friendlyName: 'Get service',


  description: 'Get service related info by service name',


  inputs: {
    serviceName: {
      friendlyName: 'serviceName',
      description: 'Service name',
      type: 'string',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {

    let serviceRecordParams = {
      name: inputs.serviceName,
      deleted: false,
    };

    try {

      let serviceRecord = await Service.findOne(serviceRecordParams)
        .tolerate(async (err) => {

          err.details = {
            serviceRecordParams,
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Service.findOne() error',
            // clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              serviceRecordParams,
            },
          });

          return 'error';
        });

      if (serviceRecord === 'error') {
        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.CRITICAL,
          emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGH,
          location: moduleName,
          message: 'Service.findOne() error',
          // clientGuid,
          // accountGuid,
          errorName: sails.config.custom.DB_ERROR_CRITICAL.name,
          payload: {
            serviceRecordParams,
          },
        });
      }


      if (serviceRecord == null) {

        /**
         * record for the specified criteria was not found
         */

        // const errorLocation = 'api/helpers/storage/get-service';
        // const errorMsg = sails.config.custom.SERVICE_NOT_FOUND;
        //
        // sails.log.error(errorLocation + ', error: ' + errorMsg);
        //
        // throw {err: {
        //     module: errorLocation,
        //     message: errorMsg,
        //     payload: {},
        //   }
        // };

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'serviceRecord for the specified criteria was not found',
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            serviceRecordParams,
            serviceRecord,
          },
        });


      } else {

        /**
         * found record for the specified criteria
         */

        return exits.success({
          status: 'ok',
          message: sails.config.custom.SERVICE_FOUND,
          payload: {
            id: serviceRecord.id,
            guid: serviceRecord.guid,
            name: serviceRecord.name,
            title: serviceRecord.title,
            funnel_name: serviceRecord.funnel_name,
            funnel_start: serviceRecord.funnel_start,
            keyboard_name: serviceRecord.keyboard_name,
            push_message_name: serviceRecord.push_message_name,
            chat_blast_name: serviceRecord.chat_blast_name,
            rooms: serviceRecord.rooms,
            max_outgoing_posts_per_day: serviceRecord.max_outgoing_posts_per_day,
            max_incoming_posts_per_day: serviceRecord.max_incoming_posts_per_day,
            make_likes_min_day: serviceRecord.make_likes_min_day,
            make_comments_min_day: serviceRecord.make_comments_min_day,
            deleted: serviceRecord.deleted,
            created_at: serviceRecord.createdAt,
            updated_at: serviceRecord.updatedAt,
          }
        });

      }

    } catch (e) {

      // const errorLocation = 'api/helpers/storage/get-service';
      // const errorMsg = sails.config.custom.SERVICE_GENERAL_ERROR;
      //
      // sails.log.error(errorLocation + ', error: ' + errorMsg);
      // sails.log.error(errorLocation + ', error details: ', e);
      //
      // throw {err: {
      //     module: errorLocation,
      //     message: errorMsg,
      //     payload: {},
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

