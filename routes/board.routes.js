var express = require('express');
var moment  = require('moment');
var router = express.Router();

var permission = require('permission');

var Board = require('../models/board');
var User  = require('../models/user');

// middleware that is specific to this router
router.use(function (req, res, next) {
  next();
});

// list
router.get('/:page(\\d+)?', function(req, res) {
  var curPage = req.param('page') || 1;
  if(curPage < 1) curPage = 1;

  Board
  .find({is_comment: false})
  .sort({registered_date: -1})
  .skip(numPerPage * (curPage-1))
  .limit(numPerPage)
  .populate('author')
  .exec(function(err, boardList){
    if(err) return res.render('pages/error');
    res.render('pages/board/list', {
      user: req.user,
      boardList: boardList,
      boardMenu: Board.getBoardMenu(''),
      pagination: makePagination('/board', curPage)
    });
  });
});

router.get('/list/:menuName/:page(\\d+)?', function(req, res){
  var curPage = req.param('page') || 1;
  if(curPage < 1) curPage = 1;
  
  var menuName = req.param('menuName');

  Board
  .find({
    is_comment: false,
    topic: menuName
  })
  .sort({registered_date: -1})
  .skip(numPerPage * (curPage-1))
  .limit(numPerPage)
  .populate('author')
  .exec(function(err, boardList){
    if(err) return res.render('pages/error');
    res.render('pages/board/list', {
      user: req.user,
      boardList: boardList,
      boardMenu: Board.getBoardMenu(menuName),
      pagination: makePagination('/board/list/'+menuName, curPage)
    });
  });
});

router.get('/new', permission(['user', 'admin']), function(req, res) {
  res.render('pages/board/form', {
    user: req.user,
    boardMenu: Board.getBoardMenu('new'),
    method: 'POST',
    sessionId: req.user._id + req.flash('fakeSessionId')
  });
});

router.post('/new', permission(['user', 'admin']), function(req, res) {
  var newBoard = new Board();
  newBoard.title = req.body.title;
  newBoard.topic = req.body.topic;
  newBoard.content = req.body.content;
  newBoard.author = req.user;
  newBoard.save(function(err, result){
    if(err || !result) return res.render('pages/error', {status: 500, message: 'Internal Server Error'});
    
    req.flash('fakeSessionId', Math.random().toString(36).substring(7));
    res.redirect('/board/view/' + result._id);
  });
});

router.get('/view/:boardId(\\d+)', permission(['guest', 'user', 'admin']), function(req, res) {
  Board
    .findOne({_id: parseInt(req.param('boardId'))})
    .populate('author')
    .exec(function(err, result){
      if(err || !result) return res.render('pages/error');
      
      Board
        .find({parent_id: result._id})
        .populate('author').exec(function(err, comments){
          if(err || !result) return res.render('pages/error');
          
          res.render('pages/board/view', {
            user: req.user,
            board: result,
            boardMenu: Board.getBoardMenu(result.topic),
            error: req.flash('error'),
            comments: comments
          });
        })
      ;
    })
  ;
});

// comment
router.post('/view/:boardId(\\d+)', permission(['guest', 'user', 'admin']), function(req, res) {
  var boardId = parseInt(req.param('boardId'));
  if( ! boardId ) return res.render('pages/error');
  
  if( ! req.body.comment || req.body.comment.length < 5 ){
    req.flash('error', '내용이 너무 짧습니다.');
    return res.redirect('/board/view/' + boardId);
  }
  
  var comment = new Board({is_comment: true});
  comment.author = req.user;
  comment.parent_id = boardId;
  comment.content = req.body.comment;
  comment.save(function(err, result){
    if(err) return res.render('pages/error', {status:500, message: err}); //'Internal Server Error'});
    
    res.redirect('/board/view/' + boardId);
  });
});

function handleError(err, res){
  if(err){
    return res.render('pages/error', {
      status: 500,
      message: 'Internal Server Error'
    });
  }
}

function makePagination(href, page){
  var curPage = page || 1;
  if(curPage < 1) curPage = 1;

  var pagination = [];
  for(var i=0; i<2*pageRange-1; ++i){
    var tPage = Number(Number(curPage) +1 + i - pageRange);
    if(tPage > 0){
      pagination.push({
        active: tPage == curPage ? 'active':'',
        index: tPage,
        href: href + '/' + tPage
      });
    }
  }
  return pagination;
}

const numPerPage = 20;
const pageRange = 3;

exports = module.exports = router;
