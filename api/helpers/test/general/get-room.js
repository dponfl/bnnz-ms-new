"use strict";

const moduleName = 'test:general:getRoom';


module.exports = {


  friendlyName: 'test:general:getRoom',


  description: 'description',


  inputs: {
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

      // await Room.create({
      //   room: 1,
      //   bronze: 9,
      //   gold: 0,
      //   platinum: 0,
      //   star: 0,
      //   clients_number: 9,
      //   active: true,
      // });

      /**
       * Clear Room table and allocate rooms for 3 "bronze" clients
       */

      if (true) {
        await Room.destroy({});

        for (let i = 0; i < 3; i++) {
          const res = await sails.helpers.general.getRoom.with({
            roomsNum: 3,
            clientCategory: 'bronze',
          });

          console.log('res: ', JSON.stringify(res, null, '   '));
        }
      }



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


