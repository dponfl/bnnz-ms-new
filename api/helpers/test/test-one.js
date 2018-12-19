module.exports = {


  friendlyName: 'Test one',


  description: '',


  inputs: {
    paramOne: {
      friendlyName: 'Parameter one',
      description: 'Parameter one description',
      type: 'string',
      required: true,
    }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {
    // TODO
    sails.log('helper: api/helpers/test/test-one, parameter: ', inputs.paramOne);

    return exits.success();
  }


};

