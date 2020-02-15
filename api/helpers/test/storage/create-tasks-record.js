"use strict";

const casual = require('casual');

const moduleName = 'test:storage:createTasksRecord';


module.exports = {


  friendlyName: 'test:storage:createTasksRecord',


  description: 'Creates Tasks record',


  inputs: {

    record: {
      friendlyName: 'record to be created',
      description: 'record to be created',
      type: 'ref',
    },

  },


  exits: {

    success: {
      description: 'All done.',
    },

    err: {
      description: 'Error',
    }

  },


  fn: async function (inputs, exits) {

    try {

      const taskRec = {
        guid: inputs.record ? inputs.record.guid || casual.uuid : casual.uuid,
        post_guid: inputs.record ? inputs.record.post_guid || casual.uuid : casual.uuid,
        account_guid: inputs.record ? inputs.record.account_guid || casual.uuid : casual.uuid,
        make_like: inputs.record ? inputs.record.make_like || casual.boolean : casual.boolean,
        make_comment: inputs.record ? inputs.record.make_comment || casual.boolean : casual.boolean,
        make_like_performed: inputs.record ? inputs.record.make_like_performed || casual.boolean : casual.boolean,
        make_comment_performed: inputs.record ? inputs.record.make_comment_performed || casual.boolean : casual.boolean,
      };

      const taskRecRes = await Tasks.create(taskRec).fetch();

      return exits.success({
        status: 'ok',
        message: 'Tasks record created',
        payload: taskRecRes,
      })

    } catch (e) {

      const errorLocation = moduleName;
      const errorMsg = `${moduleName}: General error`;

      sails.log.error(errorLocation + ', error: ' + errorMsg);
      sails.log.error(errorLocation + ', error details: ', e);

      throw {err: {
          module: errorLocation,
          message: errorMsg,
          payload: {},
        }
      };

    }

  }

};

