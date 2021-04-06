"use strict";

const moduleName = 'general:bootstrap-actions';


module.exports = {


  friendlyName: 'general:bootstrap-actions',


  description: 'Perform initial actions on system bootstrap',


  inputs: {
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


      // await sails.helpers.general.pushPendingOnboarding();

      // TODO: При запуске в режиме кластеров это нужно будет убрать
      //  иначе этот код может приводить к подхватыванию прецессом после перезапуска
      //  регистраций, которые выполняет другие активные процессы

      setTimeout(async () => {

        try {
          await sails.helpers.general.pushPendingOnboarding();
        } catch (er) {
          await LogProcessor.critical({
            message: 'Bootstrap action processing error',
            // requestId: null,
            // childRequestId: null,
            errorName: 'ERR_CRITICAL_BOOTSTRAP_ERROR',
            location: moduleName,
            emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
            payload: er,
          });
        }

      }, 5000);

    } catch (e) {

      /**
       * Просто логируем критическую ошибку, но не бросаем ошибку
       */

      await LogProcessor.critical({
        message: 'Bootstrap action processing error',
        // requestId: null,
        // childRequestId: null,
        errorName: 'ERR_CRITICAL_BOOTSTRAP_ERROR',
        location: moduleName,
        emergencyLevel: sails.config.custom.enums.emergencyLevels.HIGHEST,
        payload: e,
      });

    }

    /**
     * The below return needed for normal functioning of config/bootstrap.js
     */

    return exits.success({
      status: 'ok',
      message: 'success',
      payload: {}
    });

  }

};

