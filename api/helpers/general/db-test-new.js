"use strict";

const Joi = require('@hapi/joi');

const sleep = require('util').promisify(setTimeout);
const moment = require('moment');
const mlog = require('mocha-logger');



const moduleName = 'general:db-test-new';


module.exports = {


  friendlyName: 'general:db-test-new',


  description: 'general:db-test-new',


  inputs: {

    sql: {
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

    let result;

    try {

      result = await sails.getDatastore('clientDb')
        .leaseConnection(async (db) => {

          const resGetLock = await sails
            .sendNativeQuery(inputs.sql.getLock)
            .usingConnection(db);

          sails.log.warn(`resGetLock: ${JSON.stringify({
            id: inputs.sql.id,
            resGetLock: resGetLock.rows,
            time: moment().format(),
          }, null, 3)}`);

          mlog.success(`resGetLock: ${JSON.stringify({
            id: inputs.sql.id,
            resGetLock: resGetLock.rows,
            time: moment().format(),
          }, null, 3)}`);


          await sleep(inputs.sql.delay);

          const resReleaseLock = await sails
            .sendNativeQuery(inputs.sql.releaseLock)
            .usingConnection(db);

          sails.log.warn(`resReleaseLock: ${JSON.stringify({
            id: inputs.sql.id,
            resReleaseLock: resReleaseLock.rows,
            time: moment().format(),
          }, null, 3)}`);

          mlog.success(`resReleaseLock: ${JSON.stringify({
            id: inputs.sql.id,
            resReleaseLock: resReleaseLock.rows,
            time: moment().format(),
          }, null, 3)}`);

        });



      return exits.success({
        status: 'ok',
        message: `${moduleName} performed`,
        payload: {
          result,
        },
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

