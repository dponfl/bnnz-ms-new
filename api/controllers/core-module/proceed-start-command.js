module.exports = {


  friendlyName: 'Proceed start command',


  description: 'Proceeding start command',


  inputs: {

  },


  exits: {

  },


  fn: async function (inputs) {

    sails.log('We are inside of proceed-start-command');
    await sails.helpers.test.testOne('Parameter to be passed to helper...');

    // All done.
    return;

  }


};
