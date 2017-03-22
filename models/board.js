var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var Schema = mongoose.Schema;
 
var boardSchema = new Schema({
    _id: {
        type: Number,
        default: 1
    },
    title: String,
    author: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    content: {
        type: String,
        getter: escapeHTMLinverse
    },
    is_comment: {
        type: Boolean,
        default: false
    },
    comment: {
        type: Number,
        default: 0
    },
    parent_id: {
        type: String
    },
    topic: {
        type: String,
        default: 'free'
    },
    registered_date: {
        type: Date,
        default: Date.now
    },
    modified_date: {
        type: Date,
        default: Date.now
    }
});

var menus = [
    {name:'전체', nick:'', href: '/board', visible: false},
    {name:'자유', nick:'free', href: '/board/list/free', visible: true},
    {name:'공지', nick:'notice', href: '/board/list/notice', visible: true},
    {name:'질문', nick:'question', href: '/board/list/question', visible: true},
    {name:'인사', nick:'hello', href: '/board/list/hello', visible: true},
    {name:'문제 추천', nick:'recommend', href: '/board/list/recommend', visible: true},
    {name:'글쓰기', nick:'new', href: '/board/new', visible: false},
];
  
boardSchema.pre('save', function(next) {
   this.content = escapeHTML( this.content );
   next(); 
});

boardSchema.statics.getBoardMenu = function(currentMenuname){
  for(var i in menus){
    if( menus[i].nick == currentMenuname ) menus[i].active = 'active';
    else menus[i].active = 'basic';
  }
  return menus;
};

boardSchema.statics.menuToText = function(menuname){
  for(var i in menus){
      if( menus[i].nick == menuname ) return menus[i].name;
  }
};

function escapeHTML(s) { 
  return s.replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\\/g, '\\')
          .replace(/\//g, '/');
}

function escapeHTMLinverse(s) {
  var conv = {
    '&amp;': '&',
    '&quot;': "\"",
    '&lt;': '<',
    '&gt;': '>'
  };
  var keys = Object.keys(conv);
  for(var i in keys){
    s = s.replace(new RegExp(keys[i], "gi"), conv[keys[i]]);
  }
  return s;
}

autoIncrement.initialize(mongoose.connection);
boardSchema.plugin(autoIncrement.plugin, 'board');
module.exports = mongoose.model('board', boardSchema);