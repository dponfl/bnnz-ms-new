"use strict";

const casual = require('casual');
const mlog = require('mocha-logger');
const moment = require('moment');


module.exports = {

  deleteAllTasksDB: async () => {
    const funcName = 'test:sdk:tasks:deleteAllTasksDB';
    try {
      await Tasks.destroy({});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  deleteTaskByGuidDB: async (taskGuid) => {
    const funcName = 'test:sdk:tasks:deleteTaskByGuidDB';
    try {
      await Tasks.destroy({guid: taskGuid});
    } catch (e) {
      mlog.error(`${funcName} Error: code: ${e.code}, message: ${e.message}`);
    }
  },

  createTaskDB: async (task = null) => {
    const funcName = 'test:sdk:tasks:createTaskDB';

    let taskRec;

    try {

      taskRec = await generateTask(task);
      taskRec = _.omit(taskRec, ['id', 'createdAt', 'updatedAt']);

      taskRec = await Tasks.create(taskRec).fetch();

      return taskRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\ntaskRec: ${JSON.stringify(taskRec)}`);
    }

  },

  generateTask: async (task = null) => {
    const funcName = 'test:sdk:tasks:generateTask';

    let taskRec;

    try {

      taskRec = await generateTask(task);

      return taskRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\ntaskRec: ${JSON.stringify(taskRec)}`);
    }

  },

};

async function generateTask(task = null) {
  const funcName = 'tasks:generateTask';

  let taskRec;

  try {

    taskRec = {
      id: casual.integer(1, 1000),
      guid: casual.uuid,
      postGuid: casual.uuid,
      clientGuid: casual.uuid,
      accountGuid: casual.uuid,
      messenger: sails.config.custom.enums.messenger.TELEGRAM,
      messageId: casual.uuid,
      makeLike: true,
      makeComment: casual.boolean,
      makeLikePerformed: casual.boolean,
      makeCommentPerformed: casual.boolean,
      commentText: casual.words(7),
      createdAt: moment().format(),
      updatedAt: moment().add(1, 'minutes').format(),
    };

    if (task != null) {
      taskRec = _.assign(taskRec, task);
    }

    return taskRec;

  } catch (e) {
    mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\ntaskRec: ${JSON.stringify(taskRec)}`);
  }
}