"use strict";

const {expect} = require('chai');
const sinon = require('sinon');
const mlog = require('mocha-logger');
const casual = require('casual');

describe('tasks.generateTaskType test', function () {

  let customConfig, customConfigTasks;

  before(async function () {
    const customConfigRaw =   await sails.helpers.general.getConfig();
    customConfig = customConfigRaw.payload;
    customConfigTasks = customConfig.config.tasks;
  });


  afterEach(async function () {
    customConfig.config.tasks = customConfigTasks;
    const customConfigUpdatedRaw = await sails.helpers.general.setConfig(customConfig);
  });

  it ('should have correct config for tasks.task_types', async function () {

    expect(customConfigTasks).to.have.property('task_types');
    expect(customConfigTasks.task_types).to.have.property('LIKE', 'like');
    expect(customConfigTasks.task_types).to.have.property('LIKE_AND_COMMENT', 'like_and_comment');
    expect(customConfigTasks).to.have.property('comments_ratio').to.be.within(0, 1);
  });
});
