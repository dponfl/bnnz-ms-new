"use strict";

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

    try {

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
        'admin', // после смены названия поля нужно будет поменять
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
      });

      if (!clientRec) {
        throw new Error(`No client record found for the conditions provided, inputs.clientGuid: ${inputs.clientGuid}`);
      }


      _.forEach(clientFieldsData, async (clientFieldValue, clientFieldKey) => {

        // sails.log.debug(`*** storage:clientFieldsPut, clientField: ${clientFieldKey}=${clientFieldValue}`);

        if (clientRec[clientFieldKey] !== clientFieldValue) {

          const clientFieldRec = {
            client_guid: inputs.clientGuid,
            field: clientFieldKey,
            old_value: _.toString(clientRec[clientFieldKey]),
            new_value: _.toString(clientFieldValue),
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

      const errorLocation = 'api/helpers/storage/client-fields-put';
      const errorMsg = sails.config.custom.CLIENTFIELDSPUT_ERROR;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };
    }

  }


};

