var express = require('express');
var router = express.Router();

var path = require('path');
const fs = require('fs');
var htmlspecialchars = require('htmlspecialchars');

// middleware that is specific to this router
router.use(function (req, res, next) {
  next();
});

router.get('/', function(req, res) {
  res.render('pages/index', { user: req.user });
});

router.get('/forbidden', function(req, res) {
  res.render('pages/error', { status: 403, message: 'Forbidden' });
});

router.get('/privacy', function(req, res) {
  var filePath = path.resolve(__dirname, '../files/privacy.txt');
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err){
      throw err;
      res.status(404).end();
    }
    
    var content = htmlspecialchars(data).replace(/\n/gi, "<br>");
    res.render('pages/privacy', { content: content });
  });
});

exports = module.exports = router;