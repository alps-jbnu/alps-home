var express = require('express');
var router = express.Router();

// at last route

router.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('pages/error', {
        url: req.url,
        status: 404,
        message: 'Not Found'
    });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

exports = module.exports = router;