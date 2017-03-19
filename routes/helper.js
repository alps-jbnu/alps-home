var express = require('express');
var request = require('request');
var moment = require('moment-timezone');
var router = express.Router();

var configs = require('../config');

var sendgrid_key = configs.SENDGRID_API_KEY || 'dummy-text';
var sendgrid = require('sendgrid')(sendgrid_key);

exports.verifyGoogleReCAPTCHA = function verifyGoogleReCAPTCHA(req, res, next){
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

exports.sendEmail = function sendEmail(emailsTo, subject, body){
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
  
  sendgrid.API(sgRequest, function(error, response) {
    if (error) {
      console.error('Error response received');
    }
    
    var emails = "[";
    for(var e in emailsTo){
      emails += emailsTo[e] +", ";
    }
    emails += "]";
    console.log('send email to:', emails, response.statusCode);
  });
}