var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var router = express.Router();

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  // console.log('Time: ', Date.now());
  next();
});

router.get('/:username([a-zA-Z0-9]+).json', function(req, res) {
  var url = 'https://www.acmicpc.net/user/' + req.params.username;
  request(url, function(error, response, html){  
    if (error) {throw error};

    var $ = cheerio.load(html);
    
    function parse_problem(panel){
      var result = {};
      panel.find('.problem_number').each(function(index, item){
        var id = $(item).text();
        result[index] = {'id': id};
      });
      panel.find('.problem_title').each(function(index, item){
        var title = $(item).text();
        result[index].title = title;
      });
      return result;
    }
    
    var problem_info = $("#problem_info div.panel");
    var problems_acc = $(problem_info[0]);
    var problems_wa = $(problem_info[1]);
    
    res.json({
      "problems": {
        "ACC": parse_problem(problems_acc),
        "WA": parse_problem(problems_wa)
      }
    });
  });
});

router.get('/', function(req, res) {
  var test = [];
  for(var i=0; i<100; ++i) test.push(Math.random()*100);
  res.render('boj/views', {
    title: 'BOJ',
    test: test
  });
});

exports = module.exports = router;