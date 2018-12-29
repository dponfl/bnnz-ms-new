"use strict";

const _ = require('lodash');

module.exports = {


  friendlyName: 'Translate',


  description: 'Performs translations based on specified language and tokens',


  inputs: {
    lang: {
      friendlyName: 'language',
      description: 'Specifies language for token',
      type: 'string',
      required: true,
    },
    token: {
      friendlyName: 'Token',
      description: 'Token to be used',
      type: 'string',
      required: true,
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: "Error exit: No such token for the language"
    },

  },


  fn: async function (inputs, exits) {

    const tokens = sails.config.custom.tokens;

    if (!_.isNil(tokens[inputs.lang][inputs.token])) {

      exits.success(tokens[inputs.lang][inputs.token]);

    } else {

      sails.log.error(`No such token: ${inputs.token} for the specified language: ${inputs.lang}`)

      exits.success('***');

    }

  }


};

