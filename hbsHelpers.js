'use strict';

module.exports = exports = {

  'moment' : require('helper-moment'),

  'ifAdmin':  function(user, options) {
    var fnTrue = options.fn, 
        fnFalse = options.inverse;

    return user && user.isAdmin ? fnTrue(this) : fnFalse(this);
  },

  'ifUser':  function(user, options) {
    var fnTrue = options.fn, 
        fnFalse = options.inverse;

    return user && user.role == 'user' ? fnTrue(this) : fnFalse(this);
  },

  'ifGuest':  function(user, options) {
    var fnTrue = options.fn, 
        fnFalse = options.inverse;

    return user && user.role == 'guest' ? fnTrue(this) : fnFalse(this);
  }
  
};