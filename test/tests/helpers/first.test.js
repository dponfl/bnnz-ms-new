"use strict";

const {expect} = require('chai');
const casual = require('casual');

describe('First test', () => {

  let customConfig;

  beforeEach(async function () {

    const customConfigRaw = await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
  });


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


    // const taskRecResRaw = await Tasks.find({
    //   or: [
    //     {
    //       make_like: true,
    //       make_like_performed: false,
    //     },
    //     {
    //       make_comment: true,
    //       make_comment_performed: false,
    //     },
    //   ]
    // });
    // const taskGrouped = _.groupBy(taskRecResRaw, 'account_guid');
    //
    // expect(taskGrouped).eq('ttt');
  });

  it('should successfully use RegExp for post link', async function () {

    // const escapedRegExp = new RegExp(customConfig.postRegExp);
    // const regExp = new RegExp(escapedRegExp);

    const code = 'AAA_123-CCC';

    const post1 = `http://www.instagram.com/p/${code}`;
    const post2 = `https://www.instagram.com/p/${code}`;

    // const postRegExpRes1 = regExp.exec(post1);
    // const postRegExpRes2 = regExp.exec(post2);
    //
    const postRegExpRes1 = await sails.helpers.general.getPostCodeJoi({
      postLink: post1,
    });
    const postRegExpRes2 = await sails.helpers.general.getPostCodeJoi({
      postLink: post2,
    });

    // expect(postRegExpRes1.length).to.be.eq(3);
    // expect(postRegExpRes1[2]).to.be.eq(code);
    // expect(postRegExpRes2.length).to.be.eq(3);
    // expect(postRegExpRes2[2]).to.be.eq(code);

    expect(postRegExpRes1).to.be.eq(code);
    expect(postRegExpRes2).to.be.eq(code);

    // const regex = /^(http|https):\/\/www\.instagram\.com\/p\/(\S+)/;
    // const str = `http://www.instagram.com/p/AAA_BBB-CCC`;
    // let m;
    //
    // if ((m = regex.exec(str)) !== null) {
    //   // The result can be accessed through the `m`-variable.
    //   m.forEach((match, groupIndex) => {
    //     console.log(`Found match, group ${groupIndex}: ${match}`);
    //   });
    // }


  });

});
