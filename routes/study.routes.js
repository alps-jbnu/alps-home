var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var moment  = require('moment');
var mongoose = require('mongoose');
var router = express.Router();

var permission = require('permission');

var studyPenalty = require('../models/studyPenalty');
var studyMember  = require('../models/studyMember');
var studyGroup   = require('../models/studyGroup');
var studyProblem = require('../models/studyProblem');
var studyApply   = require('../models/studyApply');

// middleware that is specific to this router
router.use(permission(['guest', 'user', 'admin']), function (req, res, next) {
  next();
});

router.get('/', function(req, res) {
  studyMember.getList({}, {group: 1, name: 1}, function(err, memberList){
    handleError(err, res);
    
    var totalPenalty = 0;
    for(var i in memberList){
      totalPenalty += memberList[i].penalty;
    }
    totalPenalty = Math.max(totalPenalty, 0);
    
    var now = new Date();
    studyProblem.count({}, function(err, problemCount){
      studyProblem
        .find({
          "end_date": {"$gte": new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)}
        })
        .sort({
          end_date: 1,
          target_group: 1,
          problem_id: 1
        })
        .populate('target_group')
        .exec(function(err, problemList){
          handleError(err, res);
        
          res.render('pages/study/index', {
            user: req.user,
            memberList: memberList,
            totalPenalty: totalPenalty,
            problemList: problemList,
            totalProblemCount: problemCount
          });
        })
      ;
    });
  });
});

router.get('/apply/select/:id', permission(['user', 'admin']), function(req, res) {
  var id = req.param('id');
  var redirectPath = '/study/apply';
  studyApply.findById(id, function(err, entry){
    if( err || ! entry ) handleError(err);
    
    if( entry.members.indexOf(req.user._id) == -1 ){
      entry.members.addToSet(req.user._id);
    } else {
      entry.members.pull(mongoose.Types.ObjectId(req.user._id));
    }

    entry.save(function(e, members){
      if(e || !members) handleError(e);
      res.redirect(redirectPath);
    });
  });
});

router.get('/apply/delete/:id', permission(['user', 'admin']), function(req, res) {
  console.log('delete');
  studyApply
    .remove({_id: req.param('id'), creator: req.user}, function(err){
      if(err) return handleError(err);
      console.log('ok');
      res.redirect('/study/apply');
    })
  ;
});

router.get('/apply', function(req, res) {
  studyApply
    .find({
      available: true
    })
    .sort({
      start_date: -1,
      end_date: -1,
      registered_date: 1
    })
    .populate('creator')
    .populate('members')
    .exec(function(err, applyList){
      handleError(err, res);
      
      var myStr = JSON.stringify(req.user);
      for(var i in applyList){
        var cur = applyList[i];
        applyList[i].checked = JSON.stringify(cur.members).match(myStr);
        applyList[i].canDelete = JSON.stringify(cur.creator).match(myStr);
      }
      res.render('pages/study/apply', {
        user: req.user,
        list: applyList
      });
    })
  ;
});

router.post('/apply', permission(['user', 'admin']), function(req, res) {
  var newStudy = new studyApply();
  newStudy.name = req.body.study_name;
  newStudy.creator = req.user._id;
  newStudy.start_date = new Date(req.body.study_start);
  newStudy.end_date = new Date(req.body.study_end);
  newStudy.members = [ req.user ];
  newStudy.save(function(err, result){
    handleError(err, res);

    req.flash('success', '성공적으로 등록했습니다.');
    res.redirect('/study/apply');
  });
});

router.get('/problems', function(req, res) {
  studyProblem
    .find({})
    .sort({end_date: -1, start_date: 1, group: 1, problem_id: 1})
    .populate('target_group')
    .exec(function(err, problemList){
      res.render('pages/study/problems', {
        user: req.user,
        problemList: problemList
      });
    })
  ;
});

router.get('/admin', permission(['admin']), function(req, res) {
  studyGroup.find({}, function(err, groupList){
    handleError(err, res);
  
    studyMember.getList({}, {group: 1, name: 1}, function(err, memberList){
      handleError(err, res);

      studyPenalty
        .find({})
        .sort({registered_date: -1})
        .limit(10)
        .exec(function(err, list){
          handleError(err, res);
  
          res.render('pages/study/admin', {
            user: req.user,
            penaltyList: list,
            memberList: memberList,
            groupList: groupList,
            dateFormat: function(date){
              return date;
            }
          });
        })
      ;
    });
  });
});

router.post('/admin/penalty', permission(['admin']), function(req, res) {
  
  studyMember
    .findOne({name: req.body.name})
    .populate('group')
    .exec(function(err, member){
      if(err || !member) handleError(err, res);
      
      var p = new studyPenalty(req.body);
      p.save(function(err, result){
        handleError(err, res);

        member.penalty += result.penalty;
        member.save();
        res.redirect('/study/admin');
      });
    })
  ;
});

router.get('/admin/setting', permission(['admin']), function(req, res) {
  var colorList = [
    'red', 'orange', 'yellow', 'olive', 'green', 'teal', 'blue',
    'violet', 'purple', 'pink', 'brown', 'grey', 'black'
  ];
  
  studyMember.getList({}, {group: 1, name: 1}, function(err, memberList){
    handleError(err, res);
    
    studyGroup.find({}, function(err, groupList){
      handleError(err, res);
      
      res.render('pages/study/setting', {
        user: req.user,
        memberList: memberList || [],
        groupList: groupList,
        groupColorList: colorList,
        error_messages: req.flash('error')
      });
    });
  });
});

router.post('/admin/setting', permission(['admin']), function(req, res) {
  var formName = req.body.formName;
  var returnPath = '/study/admin/setting';
  
  if(formName == 'group'){
    studyGroup.create(req.body, function(err, group){
      handleError(err, res);
      
      res.redirect(returnPath);
    });
  }
  else if(formName == 'add_member'){
    studyMember.create(req.body, function(err, result){
      handleError(err, res);
  
      res.redirect(returnPath);
    });
  }
  else if(formName == 'add_problem'){
    var dateFormat = "YYYY-MM-DD";
    if( !moment(req.body.start_date, dateFormat, true).isValid()
     && !moment(req.body.end_date, dateFormat, true).isValid() ){
      req.flash('error', '잘못된 날짜입니다.');
      return res.redirect('/study/admin/setting');
    }
    
    var problem = new studyProblem(req.body);
    if(problem.start_date >= problem.end_date) {
      req.flash('error', '종료일이 시작일보다 빠를 수 없습니다');
      return res.redirect('/study/admin/setting');
    }
    
    problem.save(function(err, result){
      handleError(err, res);
  
      req.flash('success', '문제를 추가했습니다.');
      res.redirect(returnPath);
    });
  }
});

function handleError(err, res){
  if(err){
    return res.render('pages/error', {
      status: 500,
      message: 'Internal Server Error'
    });
  }
}

exports = module.exports = router;
