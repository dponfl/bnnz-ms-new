"use strict";

const moduleName = 'storage:client-fields-put';

module.exports = {


  friendlyName: 'Save data at ClientFields table',


  description: 'Save data at ClientFields table',


  inputs: {

    clientGuid: {
      friendlyName: 'clientGuid',
      description: 'clientGuid',
      type: 'string',
      required: true,
    },

    data: {
      friendlyName: 'data',
      description: 'Data to save',
      type: 'ref',
      required: true,
    },

    createdBy: {
      friendlyName: 'createdBy',
      description: 'source of update',
      type: 'string',
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

    let clientGuid;


    try {

      clientGuid = inputs.clientGuid;


      // sails.log.debug('*** storage:clientFieldsPut, inputs: ', inputs);

      const clientFieldsData = _.pick(inputs.data, [
        'guid',
        'key',
        'first_name',
        'last_name',
        'chat_id',
        'username',
        'ref_key',
        'is_ref',
        'tos_accepted',
        'messenger',
        'password',
        'deleted',
        'banned',
        'role',
        'lang',
        'funnel_name',
        'current_funnel',
        'account_use',
        'account_tmp',
        'inst_profile_tmp',
      ]);

      // sails.log.debug('*** storage:clientFieldsPut, clientFieldsData: ', clientFieldsData);

      const clientRec = await Client.findOne({
        guid: inputs.clientGuid
      })
        .tolerate(async (err) => {

          err.details = {
            guid: inputs.clientGuid
          };

          await LogProcessor.dbError({
            error: err,
            message: 'Client.findOne() error',
            clientGuid,
            // accountGuid,
            // requestId: null,
            // childRequestId: null,
            location: moduleName,
            payload: {
              guid: inputs.clientGuid
            },
          });

          return null;
        });

      if (clientRec == null) {
        // throw new Error(`No client record found for the conditions provided, inputs.clientGuid: ${inputs.clientGuid}`);

        await sails.helpers.general.throwErrorJoi({
          errorType: sails.config.custom.enums.errorType.ERROR,
          location: moduleName,
          message: 'No client record found for the conditions provided',
          clientGuid,
          errorName: sails.config.custom.STORAGE_ERROR.name,
          payload: {
            clientGuid: inputs.clientGuid,
          },
        });

      }


      _.forEach(clientFieldsData, async (clientFieldValue, clientFieldKey) => {

        // sails.log.debug(`*** storage:clientFieldsPut, clientField: ${clientFieldKey}=${clientFieldValue}`);

        if (clientRec[clientFieldKey] !== clientFieldValue) {

          const clientFieldRec = {
            client_guid: inputs.clientGuid,
            field: clientFieldKey,
            old_value: _.toString(clientRec[clientFieldKey]),
            new_value: _.toString(clientFieldValue),
            created_by: `${inputs.createdBy} => ${moduleName}`,
          };

          await ClientFields.create(clientFieldRec);

        }

      });

      return exits.success({
        status: 'ok',
        message: 'ClientFields record created',
        payload: {
          clientGuid: inputs.clientGuid,
          data: inputs.data
        },
      })

    } catch (e) {

      // const errorLocation = 'api/helpers/storage/client-fields-put';
      // const errorMsg = sails.config.custom.CLIENTFIELDSPUT_ERROR;
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

