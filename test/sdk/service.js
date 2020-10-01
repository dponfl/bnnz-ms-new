"use strict";

const casual = require('casual');
const mlog = require('mocha-logger');
const moment = require('moment');

module.exports = {

  generateService: async (serviceName = null, service = null) => {
    const funcName = 'test:sdk:service:generateService';

    let serviceRec;

    try {

      serviceRec = await generateService(serviceName, service);

      return serviceRec;

    } catch (e) {
      mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nserviceRec: ${JSON.stringify(serviceRec)}`);
    }

  },

};

async function generateService(serviceName = null, service = null) {
  const funcName = 'service:generateService';

  let serviceRec;

  try {

    switch (serviceName) {
      case 'test_personal':
        serviceRec = {
          guid: casual.uuid,
          id: 1,
          name: 'test_personal',
          title: 'beFreePersonal',
          funnel_name: "test_personal",
          funnel_start: "optin",
          rooms: 1,
          max_outgoing_posts_day: 1,
          max_incoming_posts_day: 35,
          make_likes_min_day: 35,
          make_comments_min_day: 33,
          deleted: false,
          createdAt: moment().format(),
          updatedAt: moment().add(1, 'minutes').format(),
        };
        break;
      case 'test_personal_initial':
        serviceRec = {
          guid: casual.uuid,
          id: 2,
          name: 'test_personal_initial',
          title: 'beFreeInitialPersonal',
          funnel_name: "test_personal",
          funnel_start: "optin",
          rooms: 3,
          max_outgoing_posts_day: 1,
          max_incoming_posts_day: 35,
          make_likes_min_day: 35,
          make_comments_min_day: 33,
          deleted: false,
          createdAt: moment().format(),
          updatedAt: moment().add(1, 'minutes').format(),
        };
        break;
      case 'bronze_personal':
        serviceRec = {
          guid: casual.uuid,
          id: 3,
          name: 'bronze_personal',
          title: 'beLikePersonal',
          funnel_name: "bronze_personal",
          funnel_start: "optin",
          rooms: 2,
          max_outgoing_posts_day: 1,
          max_incoming_posts_day: 35,
          make_likes_min_day: 35,
          make_comments_min_day: 25,
          deleted: false,
          createdAt: moment().format(),
          updatedAt: moment().add(1, 'minutes').format(),
        };
        break;
      case 'silver_personal':
        serviceRec = {
          guid: casual.uuid,
          id: 4,
          name: 'silver_personal',
          title: 'beHeroPersonal',
          funnel_name: "silver_personal",
          funnel_start: "optin",
          rooms: 3,
          max_outgoing_posts_day: 1,
          max_incoming_posts_day: 35,
          make_likes_min_day: 35,
          make_comments_min_day: 20,
          deleted: false,
          createdAt: moment().format(),
          updatedAt: moment().add(1, 'minutes').format(),
        };
        break;
      case 'gold_personal':
        serviceRec = {
          guid: casual.uuid,
          id: 5,
          name: 'gold_personal',
          title: 'beStarPersonal',
          funnel_name: "gold_personal",
          funnel_start: "optin",
          rooms: 4,
          max_outgoing_posts_day: 1,
          max_incoming_posts_day: 10,
          make_likes_min_day: 10,
          make_comments_min_day: 15,
          deleted: false,
          createdAt: moment().format(),
          updatedAt: moment().add(1, 'minutes').format(),
        };
        break;
      case 'platinum_personal':
        serviceRec = {
          guid: casual.uuid,
          id: 6,
          name: 'platinum_personal',
          title: 'beLegendPersonal',
          funnel_name: "platinum_personal",
          funnel_start: "optin",
          rooms: 6,
          max_outgoing_posts_day: 1,
          max_incoming_posts_day: 5,
          make_likes_min_day: 5,
          make_comments_min_day: 0,
          deleted: false,
          createdAt: moment().format(),
          updatedAt: moment().add(1, 'minutes').format(),
        };
        break;
      case 'star054':
        serviceRec = {
          guid: casual.uuid,
          id: 13,
          name: 'star054',
          title: 'beFameStar054',
          funnel_name: "star",
          funnel_start: "optin",
          rooms: 6,
          max_outgoing_posts_day: 1,
          max_incoming_posts_day: 5,
          make_likes_min_day: 5,
          make_comments_min_day: 5,
          deleted: false,
          createdAt: moment().format(),
          updatedAt: moment().add(1, 'minutes').format(),
        };
        break;
      case 'friend':
        serviceRec = {
          guid: casual.uuid,
          id: 19,
          name: 'friend',
          title: 'beFameFriend',
          funnel_name: "friend",
          funnel_start: "optin",
          rooms: 2,
          max_outgoing_posts_day: 1,
          max_incoming_posts_day: 35,
          make_likes_min_day: 35,
          make_comments_min_day: 25,
          deleted: false,
          createdAt: moment().format(),
          updatedAt: moment().add(1, 'minutes').format(),
        };
        break;
      default:
        serviceRec = {
          guid: casual.uuid,
          id: 3,
          name: 'bronze_personal',
          title: 'beLikePersonal',
          funnel_name: "bronze_personal",
          funnel_start: "optin",
          rooms: 2,
          max_outgoing_posts_day: 1,
          max_incoming_posts_day: 35,
          make_likes_min_day: 35,
          make_comments_min_day: 25,
          deleted: false,
          createdAt: moment().format(),
          updatedAt: moment().add(1, 'minutes').format(),
        };
    }

    if (service != null) {
      serviceRec = _.assign(serviceRec, service);
    }

    return serviceRec;

  } catch (e) {
    mlog.error(`${funcName} Error: \ncode: ${e.code}\nmessage: ${e.message}\nserviceRec: ${JSON.stringify(serviceRec)}`);
  }
}