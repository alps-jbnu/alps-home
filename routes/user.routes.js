var express = require('express');
var passport = require('passport');
var router = express.Router();

var User = require('../models/user');

router.get('/user', function(req, res) {
  res.json(req.user);
});

router.get('/register', autoLogout, function(req, res) {
  res.render('pages/register', {
    user : req.user
  });
});

router.post('/register', function(req, res) {
  // console.log(req);
  User.register(new User({ username : req.body.username }), req.body.password, function(err, user) {
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

function autoLogout(req, res, next) {
  req.logout();
  next();
}

exports = module.exports = router;