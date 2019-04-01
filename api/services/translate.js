"use strict";

const _ = require('lodash');

module.exports = {

  t: function (l, useToken) {
    sails.log.warn('sails.config.custom.config: ', sails.config.custom.config);
    let useLang = (_.has(sails.config.custom.config.lang, l) ? l : 'ru');
    return (!_.isNil(sails.config.custom.config.lang[useLang]['token'][useToken]) ? sails.config.custom.config.lang[useLang]['token'][useToken] : useToken);
  }, // t

  getPriceObj: function (l, useToken) {
    let useLang = (_.has(sails.config.custom.config.lang, l) ? l : 'ru');
    return (!_.isNil(sails.config.custom.config.lang[useLang]['price'][useToken]) ? sails.config.custom.config.lang[useLang]['price'][useToken] : useToken);
  }, // getPriceObj

  getConfigObj: function (l) {
    let useLang = (_.has(sails.config.custom.config.lang, l) ? l : 'ru');
    return (!_.isNil(sails.config.custom.config.lang[useLang]) ? sails.config.custom.config.lang[useLang] : null);
  }, // getConfigObj

};

