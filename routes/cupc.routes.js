var express = require('express');
var router = express.Router();
var moment = require('moment-timezone');
var configs = require('../config');

var path = require('path');
const fs = require('fs');
var htmlspecialchars = require('htmlspecialchars');

var helper = require('./helper');
var AcmApplyTeam = require('../models/acmApplyTeam');

var APPLY_START_DATE = "2018-04-30 00:00";
var APPLY_END_DATE   = "2018-05-24 00:00";

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
    "registered_at": {
      "$gte": new Date(APPLY_START_DATE),
      "$lte": new Date(APPLY_END_DATE)
    }
  }, function(err, tlist){
    if(err)
      return res.render('pages/error', {status: 500, message: err});
    
    res.render('pages/cupc', {
      title: '2018 CNUPC - 전북대학교 프로그래밍 경진대회',
      teamlist: tlist,
      canBeApply: canApply(),
      readyApply: isReady()
    });
  });
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
    text += "팀장: "+ result.member1_name + " (" +  result.member1_sid + ")<br>";
    text += "팀원1: "+ result.member2_name + " (" +  result.member2_sid + ")<br>";
    text += "팀원2: "+ result.member3_name + " (" +  result.member3_sid + ")<br>";
    var ip = result.ip_address.split('.'); ip[2] = '***';
    text += "IP: "+ ip.join('.');

    var mailHeader = '[CNUPC 2018] ';
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

router.post('/admin', function(req, res) {
  if( !!req.body.form_update ){
    return update_teams(req, res);
  }

  var password = req.body.dashboard_password;
  var answer = configs.cupc_password;
  if( !answer ){
    return res.json({
      result: false,
      messsage: 'please set password on config file'
    });
  }

  if( password == answer ){
    AcmApplyTeam.find({
      "registered_at": {
        "$gte": new Date(APPLY_START_DATE),
        "$lte": new Date(APPLY_END_DATE)
      }
    }, function(err, tlist){
      if(err)
        return res.render('pages/error', {status: 500, message: err});
    
      res.render('pages/cupc/admin', {
        title: '[ADMIN] 2018 CNUPC',
        teamlist: tlist
      });
    });
  } else {
    res.redirect('/');
  }
});

function update_teams(req, res, callback){
  var length = req.body.team_id.length || 0;
  var f = req.body;
  f.team_id.some(function(id, i){
    AcmApplyTeam.update(
      {_id: id},
      {
        name: f.team_name[i],

        member1_name: f.team_mem1[i],
        member1_sid:  f.team_sid1[i],

        member2_name: f.team_mem2[i],
        member2_sid:  f.team_sid3[i],

        member3_name: f.team_mem3[i],
        member3_sid:  f.team_sid3[i]
      },
      function(err, num, rawres){
        if(err){
          res.json({result: false});
          return true;
        }
      }
    );
  });

  var remove_list = f.team_remove || [];
  remove_list.some(function(id){
    AcmApplyTeam.remove({_id: id}, function(err){
      if(err) {
        res.json({result: false});
        return true;
      }
    });
  });

  return res.json({
    result: true
  });
}

exports = module.exports = router;
