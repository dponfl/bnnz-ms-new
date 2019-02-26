"use strict";

const _ = require('lodash');

module.exports = {
  t: function (l, useToken) {
    let useLang = (_.has(token, l) ? l : 'en')
    return (!_.isNil(token[useLang][useToken]) ? token[useLang][useToken] : useToken);
  }, // t

};

const token = {
  ru: {
    MSG_OPTIN_HELLO: 'Приветствую, $firstName$',
  },
};
