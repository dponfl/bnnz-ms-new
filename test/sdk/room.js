"use strict";

const casual = require('casual');
const mlog = require('mocha-logger');

module.exports = {

  generateRoom: async (room = null) => {
    const funcName = 'test:sdk:room:generateRoom';

    let roomRec;

    try {

      roomRec = await generateRoom(room);

      return roomRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nroomRec: ${JSON.stringify(roomRec)}`);
    }

  },

};

async function generateRoom(room = null) {
  const funcName = 'room:generateRoom';

  let roomRec;

  try {

    roomRec = {
      id: 1,
      room: 1,
      active: true,
      bronze: 0,
      gold: 0,
      platinum: 0,
      star: 1,
      accounts_number: 0,
    };


    if (room != null) {
      roomRec = _.assign(roomRec, room);
    }

    return roomRec;

  } catch (e) {
    mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nroomRec: ${JSON.stringify(roomRec)}`);
  }
}