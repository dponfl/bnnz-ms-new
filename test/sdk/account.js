"use strict";

const casual = require('casual');
const mlog = require('mocha-logger');
const uuid = require('uuid-apikey');
const moment = require('moment');
const serviceSdk = require('./service');


module.exports = {

  deleteAllAccountsDB: async () => {
    const funcName = 'test:sdk:account:deleteAllAccountsDB';
    try {
      await Account.destroy({});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  deleteAccountByGuidDB: async (accountGuid) => {
    const funcName = 'test:sdk:account:deleteAccountByGuidDB';
    try {
      await Account.destroy({guid: accountGuid});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  createAccountDB: async (account = null) => {
    const funcName = 'test:sdk:account:createAccountDB';

    let accountRec;

    try {

      accountRec = await generateAccount(account);
      accountRec = _.omit(accountRec, ['id', 'createdAt', 'updatedAt']);


      await Account.create(accountRec).fetch();

      return accountRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\naccountRec: ${JSON.stringify(accountRec)}`);
    }

  },

  generateAccount: async (account = null) => {
    const funcName = 'test:sdk:account:generateAccount';

    let accountRec;

    try {

      accountRec = await generateAccount(account);

      return accountRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\naccountRec: ${JSON.stringify(accountRec)}`);
    }

  },

};

async function generateAccount(account = null) {
  const funcName = 'account:generateAccount';

  let accountRec;

  try {

    const uuidApiKey = uuid.create();

    accountRec = {
      id: casual.integer(1, 1000),
      guid: casual.uuid,
      ref_key: uuidApiKey.apiKey,
      is_ref: true,
      subscription_active: true,
      subscription_from: moment().format(),
      subscription_until: moment().add(1, 'months').format(),
      service: await serviceSdk.generateService('gold_personal'),
      payment_plan: 'gold_personal',
      payment_made: true,
      deleted: false,
      banned: false,
      inst_profile: casual.username,
      posts_made_day: 0,
      posts_received_day: 0,
      posts_made_total: casual.integer(0, 1000),
      posts_received_total: casual.integer(0, 1000),
      requested_likes_day: casual.integer(0,30),
      made_likes_day: 0,
      requested_comments_day: casual.integer(0, 20),
      made_comments_day: 0,
      profile_provided: true,
      profile_confirmed: true,
      payment_plan_selected: true,
      subscription_confirmed_by_client: true,
      subscription_made: true,
      service_subscription_finalized: true,
      client: casual.integer(1, 1000),
      createdAt: moment().format(),
      updatedAt: moment().add(1, 'minutes').format(),
    };

    if (account != null) {
      accountRec = _.assign(accountRec, account);
    }

    return accountRec;

  } catch (e) {
    mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\naccountRec: ${JSON.stringify(accountRec)}`);
  }
}