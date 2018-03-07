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

    var text = "<!DOCTYPE html><html>";
    text += "<head><style>.label{font-size: 80%;margin-right: 5px;border: #22A7F0;background: #89C4F4;border-radius: 3px;padding: 4px 6px;color: #ffffff;}.cont{background:#f8f8f8;padding:.5em 1.5em;margin-bottom:10px;}</style></head>";
    text += "<body><div class=\"cont\"><p><span class=\"label\">이름</span>"+member.name+"</p>";
    text += "<p><span class=\"label\">연락처</span>"+member.phone+"</p>";
    text += "<p><span class=\"label\">어떻게 알고 오셨나요?</span>"+member.recommend+"</p>";
    text += "<p><span class=\"label\">한마디</span>"+member.comment+"</p></div>";
    text += "<p style=\"font-size:90%;\">" + date +"&nbsp;에 접수됨.</p></body></html>";
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
