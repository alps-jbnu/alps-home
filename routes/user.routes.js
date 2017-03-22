var express = require('express');
var passport = require('passport');
var URL = require('url');
var router = express.Router();

var helper = require('./helper');

var User = require('../models/user');
var permission = require('permission');

router.get('/user', permission(['guest', 'user', 'admin']), function(req, res) {
  res.render('pages/user/edit', {
    user: req.user,
    isLocalProvider: req.user.provider == 'local',
    success: req.flash('success'),
    error: req.flash('error')
  });
});

router.post('/user', permission(['guest', 'user', 'admin']), helper.verifyGoogleReCAPTCHA, function(req, res) {
  if( ! req.isAuthenticated() ){
    return res.render('pages/error');
  }
  
  var user = req.user;
  var body = req.body;
  
  var failedMessage = '수정을 실패했습니다';
  var successMessage = '정보가 수정되었습니다!';
  
  function saveUser(u){
    u.save(function(err, result){
      if(err)
        req.flash('error', failedMessage);
      else
        req.flash('success', successMessage);
  
      res.redirect('/user');
    });
  }

  if(body.student_id) user.student_id = body.student_id;
  if(body.nickname) user.nickname = body.nickname;

  if(user.provider == 'local'){
    if(body.new_password && body.new_password.length < 6){
      req.flash('error', '새 비밀번호가 너무 짧습니다.');
      res.redirect('/user');
    } else {
      user.authenticate(body.password, function(err, model, perr){
        if(err || !model || perr){
          req.flash('error', '비밀번호가 일치하지 않습니다.');
          res.redirect('/user');
        } else {
          if( body.new_password ){
            user.setPassword(body.new_password, function(e, m, p){
              console.log(e, m, p);
              if(e || !m || p){
                req.flash('error', '비밀번호 변경에 실패했습니다.');
                res.redirect('/user');
              } else {
                saveUser(user);
              }
            });
          } else {
            saveUser(user);
          }
        }
      });
    }
  } else {
    saveUser(user);
  }
});

router.get('/user/:userId/upgrade', permission(['admin']), function(req, res){
  User.findOne({_id: req.param('userId')}, function(err, user){
    if(err) return res.render('pages/error', {status: 500, message: err});
    if(!user) return res.render('pages/error');

    if(user.role == 'guest') user.role = 'user';
    else if(user.role == 'user') user.role = 'admin';
    
    user.save(function(err, result){
      if(err) return res.render('pages/error', {status: 500, message: err});

      res.redirect(req.header('Referrer'));
    });
  });
});

router.get('/user/:userId/downgrade', permission(['admin']), function(req, res){
  User.findOne({_id: req.param('userId')}, function(err, user){
    if(err) return res.render('pages/error', {status: 500, message: err});
    if(!user) return res.render('pages/error');

    if(user.role == 'admin') user.role = 'user';
    else if(user.role == 'user') user.role = 'guest';
    
    user.save(function(err, result){
      if(err) return res.render('pages/error', {status: 500, message: err});

      res.redirect(req.header('Referrer'));
    });
  });
});

router.get('/users/:page?', permission(['admin']), function(req, res){
  var curPage = req.param('page') || 1;
  if(curPage < 1) curPage = 1;

  const numPerPage = 20;
  const pageRange = 3;
  var pagination = [];
  for(var i=0; i<2*pageRange-1; ++i){
    var tPage = Number(Number(curPage) +1 + i - pageRange);
    if(tPage > 0){
      pagination.push({active: tPage == curPage ? 'active':'', index: tPage});
    }
  }
  
  User
  .find({})
  .sort({
    role: 1,
    provider: -1,
    displayName: 1
  })
  .skip(numPerPage * (curPage-1))
  .limit(numPerPage)
  .exec(function(err, userList){
    if(err) return res.render('pages/error', {status: 500, message: err});
    
    res.render('pages/user/list', {
      user: req.user,
      userList: userList,
      pagination: pagination
    });
  });
});

// =====================================
// DEFAULT ROUTES (login/register) =====
// =====================================
router.get('/register', redirectIfLoggedIn, function(req, res) {
  res.render('pages/register', {
    user : req.user
  });
});

router.post('/register', helper.verifyGoogleReCAPTCHA, function(req, res) {
  User.register(new User({
    username  : req.body.username,
    firstname : req.body.firstname,
    lastname  : req.body.lastname,
    student_id: req.body.student_id
  }), req.body.password, function(err, user) {
    if (err) {
      var messages = {
        'UserExistsError': '이미 존재하는 아이디입니다.'
      };
      return res.render('pages/register', {
        user : user,
        error_message: messages[err.name] || '가입에 실패했습니다. 관리자에게 문의하세요.'
      });
    }

    passport.authenticate('local')(req, res, function () {
      res.redirect(req.session.returnTo || '/');
    });
  });
});

router.get('/login', autoLogout, function(req, res) {
  var path = URL.parse(req.get('Referrer') || '/').path;
  if(path.match(/^\/login/)) path = '/';
  req.session.returnTo = path;
  
  res.render('pages/login', {
    user : req.user,
    error_messages: req.flash('error')
  });
});

router.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
  }), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  }
);

router.get('/logout', autoLogout, function(req, res) {
  res.redirect(req.get('Referrer') || '/');
});

// =====================================
// GOOGLE ROUTES =======================
// =====================================
// send to google to do the authentication
// profile gets us their basic information including their name
// email gets their emails
router.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

// the callback after google has authenticated the user
router.get('/auth/google/return',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  }
);

// =====================================
// FACEBOOK ROUTES =====================
// =====================================
router.get('/auth/facebook', passport.authenticate('facebook', {
  authType: 'rerequest', scope: ['public_profile', 'email']
}));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }), function(req, res) {
    res.redirect(req.session.returnTo || '/');
  }
);

// =====================================

function redirectIfLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    res.redirect('/');
  } else {
    next();
  }
}

function renderIfNotLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    res.render('pages/error', { status: 404, message: 'Not Found' });
  }
}

function autoLogout(req, res, next) {
  req.logout();
  next();
}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

exports = module.exports = router;