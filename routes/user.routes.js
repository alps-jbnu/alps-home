var express = require('express');
var passport = require('passport');
var router = express.Router();

var User = require('../models/user');

router.get('/user', function(req, res) {
  res.json(req.user);
});

router.get('/register', redirectIfLoggedIn, function(req, res) {
  res.render('pages/register', {
    user : req.user
  });
});

router.post('/register', function(req, res) {
  // console.log(req);
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
      res.redirect('/');
    });
  });
});

router.get('/login', autoLogout, function(req, res) {
  res.render('pages/login', {
    user : req.user,
    error_messages: req.flash('error')
  });
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }), function(req, res) {
    res.redirect('/');
  }
);

router.get('/logout', autoLogout, function(req, res) {
  res.redirect('/');
});

router.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
  }), function(req, res) {
    res.redirect('/');
  }
);

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
    successRedirect: '/',
    failureRedirect: '/login'
  })
);

// =====================================
// FACEBOOK ROUTES =====================
// =====================================
router.get('/auth/facebook', passport.authenticate('facebook', {
  authType: 'rerequest', scope: ['public_profile', 'email']
}));

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/',
    failureRedirect: '/login'
  }), function(req, res) {
    res.redirect('/');
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