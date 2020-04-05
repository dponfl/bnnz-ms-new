"use strict";

const Joi = require('@hapi/joi');

const parseSpecialTokens = require('./ParseSpecialTokens').parseSpecialTokens;

const t = require('../translate').t;

const moduleName = 'message-processor:utils';


module.exports = {

  mapDeep: function mapDeep(params) {

  const schema = Joi.object({
    client: Joi
      .any()
      .required(),
    data: Joi
      .any()
      .required(),
    additionalTokens: Joi
      .any(),
  });

  const inputRaw = schema.validate(params);
  const input = inputRaw.value;

  if (_.isArray(input.data)) {
    const arr = input.data.map((innerObj) => mapDeep({
      client: input.client,
      data: innerObj,
      additionalTokens: input.additionalTokens,
    }));

    return arr;

  } else if (_.isObject(input.data)) {
    let ob = _.forEach(input.data, (val, key, o) => {
      if (key === 'text' || key === 'url') {
        o[key] = parseSpecialTokens({
          client: input.client,
          message: t(input.client.lang, val),
          additionalTokens: input.additionalTokens,
        });
      }
    });

    return ob;

  }

},
};
