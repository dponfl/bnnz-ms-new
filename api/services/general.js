"use strict";

let rp = require('request-promise');
let _ = require('lodash');
const PromiseBB = require('bluebird');
const moduleName = 'general::';

module.exports = {
  sendREST: function (method, url, params) {
    const name = 'sendREST';

    const possibleMethods = ['POST', 'GET'];

    console.log(name + ', params:');
    console.dir(method);
    console.dir(url);
    console.dir(params);

    return new PromiseBB((resolve, reject) => {
      if (!_.some(possibleMethods, (val) => {
        return val === method;
        })) {
        // reject(name + ': No method or wrong method');
        reject(new Error(name + ': No method or wrong method'));
      }

      if (!url) {
        // reject(name + ': No url');
        reject(new Error(name + ': No url'));
      }

      let options = {
        method: method,
        uri: sails.config.HOST + url,
        body: params,
        json: true
      };

      // resolve(rp(options));

      rp(options)
        .then((result) => {
        resolve(result)
      })
        .catch((err) => {
        reject(err);
        })

    });

  }, // sendREST

  clientExists: function (client) {

    const methodName = 'clientExists';

    // dummy function
    // in reality must request DB for client info and return

    return new PromiseBB((resolve, reject) => {

      console.log(moduleName + methodName + ', client:');
      console.dir(client);

      if (client) {
        console.log(moduleName + methodName + ', client parameter passed');

        /**
         * check if such client already exists
         */

        // todo: exclude pupulate below because we do need this info here

        Client.findOne({
          chat_id: client.chatId
        })
          // .populate('messages')
          .populate('rooms')
          .populate('service')
          .exec((err, record) => {
            if (err) {
              reject(err);
            }

            let rec = (record) ? record.toObject() : null;

            // console.log('Client.findOne, rec: ');
            // console.dir(rec);

            if (!rec) {

              /**
               * record for the specified criteria was not found
               */

              console.log(moduleName + methodName + ', client was NOT FOUND');

              resolve(false);
            } else {

              /**
               * found record for the specified criteria
               */

              console.log(moduleName + methodName + ', client was FOUND');

              resolve({
                code: 200,
                data: rec,
              });
            }
          });

      } else {
        console.log(moduleName + methodName + ', no client parameter');
        // reject({
        //   code: 500,
        //   data: moduleName + methodName + ', no client parameter'
        // })

        reject(new Error(moduleName + methodName + ', no client parameter'));
      }
    });
  }, // clientExists

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