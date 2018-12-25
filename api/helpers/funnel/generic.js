module.exports = {


  friendlyName: 'Generic',


  description: 'Generic funnels helper.',


  inputs: {

  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs) {



    return exits.success();

  }


};

