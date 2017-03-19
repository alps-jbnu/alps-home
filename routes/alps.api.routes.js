var express = require('express');
var request = require('request');
var moment = require('moment-timezone');
var router = express.Router();

var waitMember = require('../models/waitMember');

var configs = require('../config');
var helper = require('./helper');

// middleware that is specific to this router
router.use(function (req, res, next) {
  next();
});

// GET ALL waitMember
router.get('/api/waitMember', function(req,res){
    res.end();
});

// GET SINGLE member
router.get('/api/waitMember/:member_id', function(req, res){
    res.end();
});

// GET member BY AUTHOR
router.get('/api/waitMember/author/:author', function(req, res){
    res.end();
});

// CREATE member
router.post('/api/waitMember', helper.verifyGoogleReCAPTCHA, function(req, res){
  function makeForm(member){
    var date = moment(member.registered_date).tz('Asia/Seoul').format('YYYY/MM/DD hh:mm a z');
 
    var text = "<div class=\"ui container\" style=\"padding: 1em 2em;\">";
    text += "<p><span class=\"ui label\">이름</span><li>"+member.name+"</li></p>";
    text += "<p><span class=\"ui label\">연락처</span><li>"+member.phone+"</li></p>";
    text += "<p><span class=\"ui label\">어떻게 알고 오셨나요?</spaN><li>"+member.recommend+"</li></p>";
    text += "<p><span class=\"ui label\">한마디</span><li>"+member.comment+"</li></p>";
    text += "<br><br><p>" + date +"&nbsp;에 접수됨.</p>";
    text += "</div>";
    return text;
  }

  var member = new waitMember(req.body);
  member.save(function(err){
    if(err){
      console.error(err);
      res.json({result: 0});
      return;
    }

    var text = makeForm(member);
    helper.sendEmail(configs.admins, 'ALPS 가입 신청 메일', text);
    res.json({result: 1});
  });
});

// UPDATE THE member
router.put('/api/waitMember/:member_id', function(req, res){
    res.end();
});

// DELETE member
router.delete('/api/waitMember/:member_id', function(req, res){
    res.end();
});

exports = module.exports = router;
