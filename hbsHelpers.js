'use strict';

var moment = require('helper-moment', {locale: 'kr'});

var markdown = require('markdown').markdown;

var Board = require('./models/board');

module.exports = exports = {

  'moment' : moment,

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
  },
  
  
  'section': function(name, options){
      if(!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
  },
  
  'markdownToHtml': function(text, options){
    return markdown.toHTML(text);
  },
  
  'topicToText': Board.menuToText

};