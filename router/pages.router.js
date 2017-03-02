var express = require('express');
var router = express.Router();

// middleware that is specific to this router
router.use(function (req, res, next) {
  next();
});

router.get('/', function(req, res) {
  res.render('pages/index');
});

exports = module.exports = router;