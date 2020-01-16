"use strict";

const moduleName = 'test:test';


module.exports = {


  friendlyName: 'test:test',


  description: '***********************',


  inputs: {

    // account: {
    //   friendlyName: '*****',
    //   description: '*****',
    //   type: 'ref',
    //   required: true,
    // },

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

      let ttt01 = 1;

      sails.log(`ttt01=${ttt01}`);
      [ttt01] = await t01(ttt01);
      sails.log(`ttt01=${ttt01}`);
      [ttt01] = await t02(ttt01);
      sails.log(`ttt01=${ttt01}`);
      [ttt01] = await t01(ttt01);
      sails.log(`ttt01=${ttt01}`);

      return exits.success({
        status: 'ok',
        message: '**************',
        payload: {},
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

async function t01(t) {
  sails.log(`function t01, before: t=${t}`);
  t = 2;
  sails.log(`function t01, after: t=${t}`);
  return [t];
}

async function t02(t) {
  sails.log(`function t02, before: t=${t}`);
  t=3;
  sails.log(`function t01, after: t=${t}`);
  return [t];
}

