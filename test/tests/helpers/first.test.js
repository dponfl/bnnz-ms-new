"use strict";

const {expect} = require('chai');
const casual = require('casual');

describe('First test', () => {
  it('Check value', async () => {
    // const res = await sails.helpers.test.general.test();
    // const val = res.payload.val || null;
    // // expect(val).to.equal('two value');
    // expect(sails.config.datastores.default).equal('ttt');


    // const taskRecResRaw = await sails.helpers.test.storage.createTasksRecord({
    //   guid: '12345',
    // });

//     const sql = `
// SELECT *
// FROM  tasks t
// GROUP BY t.account_guid
// `;
//
//     const taskRecResRaw = await sails.sendNativeQuery(sql);


    const taskRecResRaw = await Tasks.find({
      or: [
        {
          make_like: true,
          make_like_performed: false,
        },
        {
          make_comment: true,
          make_comment_performed: false,
        },
      ]
    });
    const taskGrouped = _.groupBy(taskRecResRaw, 'account_guid');

    expect(taskGrouped).eq('ttt');
  });
});
