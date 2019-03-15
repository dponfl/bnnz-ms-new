"use strict";

const _ = require('lodash');

module.exports = {

  t: function (l, useToken) {
    let useLang = (_.has(sails.config.custom.chatConfig, l) ? l : 'ru');
    return (!_.isNil(sails.config.custom.chatConfig[useLang]['token'][useToken]) ? sails.config.custom.chatConfig[useLang]['token'][useToken] : useToken);
  }, // t

  getPriceObj: function (l, useToken) {
    let useLang = (_.has(sails.config.custom.chatConfig, l) ? l : 'ru');
    return (!_.isNil(sails.config.custom.chatConfig[useLang]['price'][useToken]) ? sails.config.custom.chatConfig[useLang]['price'][useToken] : useToken);
  }, // getPriceObj

  getConfigObj: function (l) {
    let useLang = (_.has(sails.config.custom.chatConfig, l) ? l : 'ru');
    return (!_.isNil(sails.config.custom.chatConfig[useLang]) ? sails.config.custom.chatConfig[useLang] : null);
  }, // getConfigObj

};

