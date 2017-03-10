var express = require('express');
var request = require('request');
var router = express.Router();

var waitMember = require('../models/waitMember');

var configs = require('../config');

var sendgrid_key = configs.SENDGRID_API_KEY || 'dummy-text';
var sendgrid = require('sendgrid')(sendgrid_key);

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
  function makeForm(member){
    var date = new Date(member.registered_date), timeZoneOffset = +9;
    var tz = date.getTime() + (date.getTimezoneOffset() * 60000) + (timeZoneOffset * 3600000);
    date.setTime(tz);
    
    var text = "";
    text += "<p><a class=\"ui label\">이름</a><li>"+member.name+"</li></p>";
    text += "<p><a class=\"ui label\">연락처</a><li>"+member.phone+"</li></p>";
    text += "<p><a class=\"ui label\">어떻게 알고 오셨나요?</a><li>"+member.recommend+"</li></p>";
    text += "<p><a class=\"ui label\">한마디</a><li>"+member.comment+"</li></p>";
    text += "<br><br><p>" + date.toGMTString() +"&nbsp;에 접수됨.</p>";
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
    sendEmail(configs.admins, 'ALPS 가입 신청 메일', text);
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
  var secretKey = configs.googleReCAPTCHA.secretKey;
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

function sendEmail(emailsTo, subject, body){
  function makeHtml(html){
    return "<!doctype html><html><head><link rel=\"stylesheet\" type=\"text/css\" href=\"https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.9/semantic.min.css\"/></head><body>"
     + html + "</body></html>";
  }
  var emails = [];
  for(var e in emailsTo){
    emails.push({email: emailsTo[e]});
  }
  
  var sgRequest = sendgrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: {
      personalizations: [
        {
          to: emails,
          subject: subject,
        },
      ],
      from: {
        email: 'no-reply@alps.jbnu.ac.kr',
        name: 'ALPS'
      },
      content: [
        {
          type: 'text/html',
          value: makeHtml(body),
        },
      ],
    },
  });
  console.log(makeHtml(body));
  sendgrid.API(sgRequest, function(error, response) {
    if (error) {
      console.log('Error response received');
    }
    
    var emails = "";
    for(var e in emailsTo){
      emails += emailsTo[e] +", ";
    }
    console.log('send email to:', emails, response.statusCode);
  });
}

exports = module.exports = router;