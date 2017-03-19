var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var router = express.Router();

var permission = require('permission');

// middleware that is specific to this router
router.use(function (req, res, next) {
  next();
});

router.get('/:username([a-zA-Z0-9]+).json', function(req, res) {
  getJSONProblems(req.param('username'), function(result){
    res.json(result || {});
  });
});

router.get('/', function(req, res) {
  var user = req.param('user');
  
  getJSONProblems(user, function(problems){
    res.render('boj/views', {
      title: 'BOJ',
      username: user,
      problems_ACC: {
        length: Object.keys(problems.ACC).length,
        list: problems.ACC,
        toString: JSON.stringify(problems.ACC)
      },
      problems_WA: {
        length: Object.keys(problems.WA).length,
        list: problems.WA,
        toString: JSON.stringify(problems.WA)
      }
    });
  });
});

function getJSONProblems(username, callback){
  var url = 'https://www.acmicpc.net/user/' + username;
  request(url, function(error, response, html){  
    if (error) {
      throw error;
      return callback(error);
    }

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
    
    return callback({
      "ACC": parse_problem(problems_acc),
      "WA": parse_problem(problems_wa)
    });
  });
}

exports = module.exports = router;