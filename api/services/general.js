"use strict";

let rp = require('request-promise');
let _ = require('lodash');
const PromiseBB = require('bluebird');
const moduleName = 'general::';

module.exports = {
  // sendREST: async function (method, url, params) {
  //   const methodName = 'sendREST';
  //
  //   const possibleMethods = ['POST', 'GET'];
  //
  //   console.log(methodName + ', params:');
  //   console.dir(method);
  //   console.dir(url);
  //   console.dir(params);
  //
  //   // return new PromiseBB((resolve, reject) => {
  //   //   if (!_.some(possibleMethods, (val) => {
  //   //     return val === method;
  //   //     })) {
  //   //     // reject(name + ': No method or wrong method');
  //   //     reject(new Error(name + ': No method or wrong method'));
  //   //   }
  //   //
  //   //   if (!url) {
  //   //     // reject(name + ': No url');
  //   //     reject(new Error(name + ': No url'));
  //   //   }
  //   //
  //   //   let options = {
  //   //     method: method,
  //   //     uri: sails.config.HOST + url,
  //   //     body: params,
  //   //     json: true
  //   //   };
  //   //
  //   //   // resolve(rp(options));
  //   //
  //   //   rp(options)
  //   //     .then((result) => {
  //   //     resolve(result)
  //   //   })
  //   //     .catch((err) => {
  //   //     reject(err);
  //   //     })
  //   //
  //   // });
  //
  //   if (!_.some(possibleMethods, (val) => {
  //       return val === method;
  //     })) {
  //     return {
  //       code: 500,
  //       data: `Error at ${moduleName}${methodName}: No method or wrong method`,
  //     };
  //   }
  //
  //   if (!url) {
  //     return {
  //       code: 500,
  //       data: `Error at ${moduleName}${methodName}: No url`,
  //     };
  //   }
  //
  //   let options = {
  //     method: method,
  //     uri: sails.config.HOST + url,
  //     body: params,
  //     json: true
  //   };
  //
  //   var result = await rp(options);
  //
  //   if (!result) {
  //
  //     return {
  //       code: 500,
  //       data: `Error at ${moduleName}${methodName}: No result from rp`,
  //     };
  //
  //   } else {
  //
  //     return result;
  //
  //   }
  //
  //
  // }, // sendREST

  // clientExists: async function (client) {
  //
  //   const methodName = 'clientExists';
  //
  //   console.log(moduleName + methodName + ', client:');
  //   console.dir(client);
  //
  //   // return new PromiseBB((resolve, reject) => {
  //   //
  //   //   console.log(moduleName + methodName + ', client:');
  //   //   console.dir(client);
  //   //
  //   //   if (client) {
  //   //     console.log(moduleName + methodName + ', client parameter passed');
  //   //
  //   //     /**
  //   //      * check if such client already exists
  //   //      */
  //   //
  //   //     // todo: exclude pupulate below because we do need this info here
  //   //
  //   //     Client.findOne({
  //   //       chat_id: client.chatId
  //   //     })
  //   //       // .populate('messages')
  //   //       .populate('rooms')
  //   //       .populate('service')
  //   //       .exec((err, record) => {
  //   //         if (err) {
  //   //           reject(err);
  //   //         }
  //   //
  //   //         let rec = (record) ? record.toObject() : null;
  //   //
  //   //         // console.log('Client.findOne, rec: ');
  //   //         // console.dir(rec);
  //   //
  //   //         if (!rec) {
  //   //
  //   //           /**
  //   //            * record for the specified criteria was not found
  //   //            */
  //   //
  //   //           console.log(moduleName + methodName + ', client was NOT FOUND');
  //   //
  //   //           resolve(false);
  //   //         } else {
  //   //
  //   //           /**
  //   //            * found record for the specified criteria
  //   //            */
  //   //
  //   //           console.log(moduleName + methodName + ', client was FOUND');
  //   //
  //   //           resolve({
  //   //             code: 200,
  //   //             data: rec,
  //   //           });
  //   //         }
  //   //       });
  //   //
  //   //   } else {
  //   //     console.log(moduleName + methodName + ', no client parameter');
  //   //     // reject({
  //   //     //   code: 500,
  //   //     //   data: moduleName + methodName + ', no client parameter'
  //   //     // })
  //   //
  //   //     reject(new Error(moduleName + methodName + ', no client parameter'));
  //   //   }
  //   // });
  //
  //   if (client) {
  //
  //     console.log(moduleName + methodName + ', client parameter passed');
  //
  //     /**
  //      * check if such client already exists
  //      */
  //
  //     var record = await Client.findOne({
  //       chat_id: client.chatId
  //     })
  //     // .populate('messages')
  //       .populate('rooms')
  //       .populate('service');
  //
  //     if (!record) {
  //
  //       /**
  //        * record for the specified criteria was not found
  //        */
  //
  //       console.log(moduleName + methodName + ', client was NOT FOUND');
  //
  //       return false;
  //
  //     } else {
  //
  //       /**
  //        * found record for the specified criteria
  //        */
  //
  //       console.log(moduleName + methodName + ', client was FOUND');
  //
  //       return {
  //         code: 200,
  //         data: record,
  //       };
  //
  //     }
  //
  //   } else {
  //
  //     console.log(moduleName + methodName + ', no client parameter');
  //
  //     return {
  //       code: 500,
  //       data: `Error at ${moduleName}${methodName}: No client parameter`,
  //     };
  //
  //   }
  //
  // }, // clientExists

  clientCodes: function () {
    return {
      /**
       * New client
       */

      newClient: {
        code: 200,
        ext_code: 100,
        text: 'New client',
      },

      /**
       * New client creation error
       */

      newClientCreateError: {
        code: 500,
        ext_code: 500,
        text: 'New client create error',
      },

      /**
       * Existing client
       */

      existingClient: {
        code: 200,
        ext_code: 101,
        text: 'Existing client',
      },

      /**
       * Error and no info about client
       */

      noClient: {
        code: 200,
        ext_code: 103,
        text: 'No info about client',
      },

      /**
       * New client used the wrong command
       */

      wrongCommand: {
        code: 200,
        ext_code: 104,
        text: 'Wrong command for new client',
      },


    }
  }, // clientCodes

  RESTLinks: function () {
    return {
      start: '/core/start',
      help: '/core/help',


      mgSendInlineButtons: '/mg/sendinlinebuttons',
      mgSendForcedMessage: '/mg/sendforcedmessage',
      mgSendSimpleMessage: '/mg/sendsimplemessage',

      trueInstagram: '^https:\/\/www\.instagram\.com\/|^https:\/\/instagram\.com\/',
    }
  }, // RESTLinks

  generalLinks: function () {
    return {
      faq: 'https://policies.google.com/terms',
      web: 'https://policies.google.com/terms',
    }
  }, // generalLinks

};