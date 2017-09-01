var express = require('express');
var router = express.Router();
var moment = require('moment-timezone');
var configs = require('../config');

var path = require('path');
const fs = require('fs');
var htmlspecialchars = require('htmlspecialchars');

var helper = require('./helper');
var AcmApplyTeam = require('../models/acmApplyTeam');

var APPLY_START_DATE = "2017-08-14 00:00";
var APPLY_END_DATE   = "2017-09-12 19:00";

function isReady(){
  var start_date = moment.tz(APPLY_START_DATE, "Asia/Seoul");
  var now = moment().tz("Asia/Seoul");
  return start_date > now;
}
function canApply(){
  var start_date = moment.tz(APPLY_START_DATE, "Asia/Seoul");
  var end_date = moment.tz(APPLY_END_DATE, "Asia/Seoul");
  var now = moment().tz("Asia/Seoul");
  return start_date <= now && now <= end_date;
}

// middleware that is specific to this router
router.use(function (req, res, next) {
  next();
});

router.get('/', function(req, res) {
  AcmApplyTeam.find({
    registered_date: {
      $gte: new Date(APPLY_START_DATE),
      $lte: new Date(APPLY_END_DATE)
    }
  }, function(err, tlist){
    if(err)
      return res.render('pages/error', {status: 500, message: err});
    
    res.render('pages/acm', {
      title: '2017 ACM ICPC 인터넷 예선 및 전북대학교 프로그래밍 경진대회',
      teamlist: tlist,
      canBeApply: canApply(),
      readyApply: isReady()
    });
  });
});

router.get('/registration', function(req, res) {
  res.render('pages/acm/registration');
});

router.get('/references', function(req, res) {
  res.render('pages/acm/references');
});

router.get('/readme', function(req, res) {
  res.render('pages/acm/readme');
});

router.post('/', helper.verifyGoogleReCAPTCHA, function(req, res) {
  if( canApply() == false ){
    // 신청 기간 외에는 404 Not Found
    return res.render('pages/error');
  }
  
  var newTeam = new AcmApplyTeam(req.body);
  newTeam.name = req.body.teamname;
  var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
  newTeam.ip_address = ip || '';
  newTeam.save(function(err, result){
    if(err || !result){
      // return res.render('pages/error', {status: 500, message: 'Internal Server Error'});
      return res.json({
        result: 0,
        responeDesc: 'Internal Server Error'
      });
    }
    
    var date = moment(result.registered_date).tz('Asia/Seoul').format('YYYY/MM/DD hh:mm a z');
    var text = "";
    text += "팀 이름: "+ result.name + "<br>";
    text += "연락처: "+ result.phone + "<br>";
    text += "팀장: "+ result.member1_name + " (" +  result.member1_sid + ") / " + result.member1_mail + "<br>";
    text += "팀원1: "+ result.member2_name + " (" +  result.member2_sid + ") / " + result.member2_mail + "<br>";
    text += "팀원2: "+ result.member3_name + " (" +  result.member3_sid + ") / " + result.member3_mail + "<br>";
    var ip = result.ip_address.split('.'); ip[2] = '***';
    text += "IP: "+ ip.join('.');

    var mailHeader = '[ACM-ICPC 2017] ';
    mailHeader += '참가 팀(' + result.name + ') 접수 알림'; 
    helper.sendEmail(configs.admins, mailHeader, text);

    res.json({
      result: 1,
      team: result.name,
      member1: result.member1_name,
      member2: result.member2_name,
      member3: result.member3_name
    });
  });
});

exports = module.exports = router;
