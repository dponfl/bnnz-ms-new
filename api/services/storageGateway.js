"use strict";

let _ = require('lodash');
const PromiseBB = require('bluebird');

const uuid = require('uuid-apikey');

const moduleName = 'storageGateway::';

module.exports = {

  /**
   * Client storage
   */

  clientCreate: async function (params) {

    const methodName = 'clientCreate';

    sails.log.info(moduleName + methodName + ', params:', params);

    // return new PromiseBB((resolve) => {
    //
    //   Client.create(params).exec((err, record) => {
    //     if (err) {
    //       resolve({
    //         code: 500,
    //         data: err,
    //       });
    //     }
    //
    //     if (record) {
    //       resolve({
    //         code: 200,
    //         data: record,
    //       });
    //     }
    //   })
    //
    // });


    var record = await Client.create(params);

    if (!record) {

      return {
        code: 500,
        data: `Error at ${moduleName}${methodName}`,
      };

    } else {

      return {
        code: 200,
        data: record,
      };

    }

  }, // clientCreate

  clientUpdate: async function (criteria, params) {

    const methodName = 'clientUpdate';

    sails.log.info(moduleName + methodName + ', criteria: ', criteria, ', params:', params);

    // return new PromiseBB((resolve) => {
    //
    //   Client.update(criteria, params).exec((err, record) => {
    //     if (err) {
    //       resolve({
    //         code: 500,
    //         data: err,
    //       });
    //     }
    //
    //     if (record) {
    //       resolve({
    //         code: 200,
    //         data: record,
    //       });
    //     }
    //   })
    //
    // });


    var record = await Client.update(criteria, params);

    if (!record) {

      return {
        code: 500,
        data: `Error at ${moduleName}${methodName}`,
      }

    } else {

      return {
        code: 200,
        data: record,
      };

    }

  }, // clientUpdate

  /**
   * Message storage
   */

  messageCreate: async function (params) {

    const methodName = 'messageCreate';

    console.log(moduleName + methodName + ', params:');
    console.dir(params);

    // return new PromiseBB((resolve) => {
    //
    //   Message.create(params).exec((err, record) => {
    //     if (err) {
    //       resolve({
    //         code: 500,
    //         data: err,
    //       });
    //     }
    //
    //     if (record) {
    //       resolve({
    //         code: 200,
    //         data: record,
    //       });
    //     }
    //   })
    //
    // });

    var record = await Message.create(params);

    if (!record) {

      return {
        code: 500,
        data: `Error at ${moduleName}${methodName}`,
      }

    } else {

      return {
        code: 200,
        data: record,
      }

    }


  }, // messageCreate

  /**
   * Ref storage
   */

  getRef: async function (ref) {

    const methodName = 'getRef';

    console.log(moduleName + methodName + ', ref: ' + ref);

    // return new PromiseBB((resolve, reject) => {
    //
    //   if (ref && uuid.isAPIKey(ref)) {
    //     console.log(moduleName + methodName + ', ref code: ' + ref);
    //     console.log(moduleName + methodName + ', ref is API Key');
    //   } else {
    //     console.log(moduleName + methodName + ', No ref code OR ref is NOT API Key');
    //     resolve(false);
    //     return;
    //   }
    //
    //   Ref.findOne({
    //     key: ref,
    //     used: false,
    //     deleted: false,
    //   }).exec((err, record) => {
    //     if (err) {
    //       reject(err);
    //       return;
    //     }
    //
    //     let rec = (record) ? record.toObject() : null;
    //
    //     if (!rec) {
    //
    //       /**
    //        * record for the specified criteria was not found
    //        */
    //
    //       console.log(moduleName + methodName + ', ref key was NOT FOUND');
    //
    //       resolve(false);
    //       return;
    //     } else {
    //
    //       /**
    //        * found record for the specified criteria
    //        */
    //
    //       console.log(moduleName + methodName + ', ref key was FOUND, key: ' + rec.key);
    //
    //       Ref.update({key: ref}, {used: true}).exec((error, updated) => {
    //         if (error) {
    //           reject(error);
    //           return;
    //         }
    //
    //         console.log(moduleName + methodName + ', updated record: ');
    //         console.dir(updated);
    //
    //         resolve({
    //           guid: rec.guid,
    //           key: rec.key,
    //           service: rec.service,
    //         });
    //         return;
    //       });
    //     }
    //   })
    // });

    if (ref && uuid.isAPIKey(ref)) {
      console.log(moduleName + methodName + ', ref code: ' + ref);
      console.log(moduleName + methodName + ', ref is API Key');
    } else {
      console.log(moduleName + methodName + ', No ref code OR ref is NOT API Key');
      return false;
    }

    var record = await ServiceRef.findOne({
      key: ref,
      used: false,
      deleted: false,
    });

    if (!record) {

      /**
       * record for the specified criteria was not found
       */

      console.log(moduleName + methodName + ', ref key was NOT FOUND');

      return false;

    } else {

      /**
       * found record for the specified criteria
       */

      console.log(moduleName + methodName + ', ref key was FOUND, key: ' + rec.key);

      var rec = await Ref.update({key: ref}, {used: true});

      if (!rec) {

        return false;

      } else {

        return {
          guid: rec.guid,
          key: rec.key,
          service: rec.service,
        }

      }

    }

  }, // getRef

  /**
   * Service storage
   */

  getService: async function (service) {

    const methodName = 'getService';

    console.log(moduleName + methodName + ', service: ' + service);

    // return new PromiseBB((resolve, reject) => {
    //
    //   Service.findOne({
    //     name: service,
    //     deleted: false,
    //   }).exec((err, record) => {
    //     if (err) {
    //       reject(err);
    //       return;
    //     }
    //
    //     let rec = (record) ? record.toObject() : null;
    //
    //     if (!rec) {
    //
    //       /**
    //        * record for the specified criteria was not found
    //        */
    //
    //       console.log(moduleName + methodName + ', service was NOT FOUND');
    //
    //       resolve(false);
    //       return;
    //     } else {
    //
    //       /**
    //        * found record for the specified criteria
    //        */
    //
    //       console.log(moduleName + methodName + ', service was FOUND, service: ' + rec.name);
    //
    //       resolve(rec);
    //       return;
    //     }
    //   });
    // });

    var record = await Service.findOne({
      name: service,
      deleted: false,
    });

    if (!record) {
      return false;
    } else {
      return record;
    }

  }, // getService
};