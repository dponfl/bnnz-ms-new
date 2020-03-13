"use strict";

module.exports = {
  stubWrap: function (f) {
    if (typeof f === 'function') {
      return f();
    } else {
      return f;
    }
  }
};

