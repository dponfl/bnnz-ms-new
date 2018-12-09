"use strict";

let _ = require('lodash');
const PromiseBB = require('bluebird');

const uuid = require('uuid-apikey');

const moduleName = 'paymentGateway::';

module.exports = {

  /**
   * Make payment
   */

  makePayment: async function (params) {

    const methodName = 'makePayment';

    sails.log.info(moduleName + methodName + ', params:', params);

    // return new PromiseBB((resolve) => {
    //
    //
    //   resolve({
    //     code: 200,
    //     data: {res: 'ok'},
    //   });
    //
    // });

    return {
      code: 200,
      data: {res: 'ok'},
    }

  }, // makePayment


};