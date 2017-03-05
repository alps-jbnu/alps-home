var express = require('express');
var request = require('request');
var router = express.Router();

var waitMember = require('../models/waitMember.model');

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
router.post('/api/waitMember', verifyGoogleReCAPTCHA, function(req, res){
  var member = new waitMember(req.body);
  member.save(function(err){
    if(err){
      console.error(err);
      res.json({result: 0});
      return;
    }
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

function verifyGoogleReCAPTCHA(req, res, next){
  // g-recaptcha-response is the key that browser will generate upon form submit.
  // if its blank or null means user has not selected the captcha, so return the error.
  if(req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    return res.json({"responseCode" : 1, "responseDesc" : "로봇이 아닌 지 확인이 필요합니다."});
  }
  // Put your secret key here.
  var secretKey = "6LcOthcUAAAAALUeDdO99SguVmFNdKF7IVPcXu2A";
  // req.connection.remoteAddress will provide IP address of connected user.
  var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
  // Hitting GET request to the URL, Google will respond with success or error scenario.
  request(verificationUrl,function(error,response,body) {
    body = JSON.parse(body);
    // Success will be true or false depending upon captcha validation.
    if(body.success !== undefined && !body.success) {
      return res.json({"responseCode" : 1, "responseDesc" : "인증에 실패하였습니다. 페이지를 새로고침 해주세요."});
    }
    next();
    // res.json({"responseCode" : 0,"responseDesc" : "Success"});
  });
}

exports = module.exports = router;