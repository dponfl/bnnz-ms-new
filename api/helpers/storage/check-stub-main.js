"use strict";

const utils = require('../../services/utils');

const mlog = require('mocha-logger');

const moduleName = 'storage:check-stub-main';


module.exports = {


  friendlyName: 'storage:check-stub-main',


  description: '***********************',


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

    // mlog.log(`${moduleName} started...`);

    try {

      const oneRes = utils.stubWrap(await sails.helpers.storage.checkStubOne({
        prop: 'prop-1',
        message: 'prop-1 message',
      }));

      // mlog.pending(`oneRes: ${JSON.stringify(oneRes, null, 3)}`);

      // const twoRes = utils.stubWrap(await sails.helpers.storage.checkStubTwo.with({
      //   data: {
      //     prop: 'prop-2',
      //     message: 'prop-2 message',
      //   }
      // }));

      const twoRes = utils.stubWrap(await sails.helpers.storage.checkStubTwo({
        prop: 'prop-2',
        message: 'prop-2 message',
      }));

      // mlog.pending(`twoRes: ${JSON.stringify(twoRes, null, 3)}`);

      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          oneRes: oneRes,
          twoRes: twoRes,
        },
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

