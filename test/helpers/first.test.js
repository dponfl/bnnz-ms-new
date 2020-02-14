"use strict";

const {expect} = require('chai');

describe('First test', () => {
  it('Check value', async () => {
    const res = await sails.helpers.test.general.test();
    const val = res.payload.val || null;
    expect(val).to.equal('two value');
  });
});
