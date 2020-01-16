"use strict";

const moduleName = 'test:test02';


module.exports = {


  friendlyName: 'test:test02',


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

      // const accountRec = await Account.find({
      //   where: {
      //     and: [
      //       {client: {'>': 980}},
      //       {client: {'<': 980}},
      //     ],
      //   },
      //   select: ['guid', 'inst_profile', 'client'],
      // });

      // const accountRec = await Account.find({
      //   where: {
      //      client: {'>': 980},
      //   },
      //   select: ['guid', 'inst_profile', 'client'],
      // });

      const omitArray = ['one', 'two'];
      const someArray = ['five', 'one', 'three', 'two', 'four'];

      // const accountRec = _.filter(someArray, (elem) => {
      //   return _.indexOf(omitArray, elem) === -1;
      // });

      _.remove(someArray, (elem) => {
        return _.indexOf(omitArray, elem) !== -1;
      });

      sails.log('accountRec:', someArray);
      sails.log(`accountRec length: ${someArray.length}`);


      // sails.log('accountRec:', accountRec);
      // sails.log(`accountRec length: ${accountRec.length}`);

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


