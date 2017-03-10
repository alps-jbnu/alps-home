/**
 * passport.js
*/

'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

// load the auth variables
var configAuth = require('./config/auth');

var User = require('./models/user');

module.exports = exports = function(app) {
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // passport config
  passport.use(new LocalStrategy(User.authenticate()));
  
  // =========================================================================
  // GOOGLE ==================================================================
  // =========================================================================
  passport.use(new GoogleStrategy({

    clientID        : configAuth.googleAuth.clientID,
    clientSecret    : configAuth.googleAuth.clientSecret,
    callbackURL     : configAuth.googleAuth.callbackURL,

  },
  function(token, refreshToken, profile, done) {

    // make the code asynchronous
    // User.findOne won't fire until we have all our data back from Google
    process.nextTick(function() {
      
      // try to find the user based on their google id
      User.findOne({ 'google.id' : profile.id }, function(err, user) {
        if (err)
          return done(err);

        if (user) {
          // if a user is found, log them in
          return done(null, user);
        } else {
          // if the user isnt in our database, create a new user
          var newUser = new User({
            // set all of the relevant information
            google: {
              id: profile.id,
              token: token,
              name: profile.name,
              email: profile.emails[0].value,
              displayName: profile.displayName
            },
            provider: 'google'
          });
          
          // save the user
          newUser.save(function(err) {
            if (err)
              throw err;
            return done(null, newUser);
          });
        }
      });
    });
  }));
  
  // =========================================================================
  // FACEBOOK ================================================================
  // =========================================================================
  passport.use(new FacebookStrategy({
    clientID: configAuth.facebookAuth.clientID,
    clientSecret: configAuth.facebookAuth.clientSecret,
    callbackURL: configAuth.facebookAuth.callbackURL,
    passReqToCallback: true,
  }, function(req, accessToken, refreshToken, profile, done) {
    User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
      if (user) { return done(err, user); }
      var newUser = new User({
        facebook: {
          id: profile.id,
          name: profile.name,
          displayName: profile.displayName
        },
        provider: 'facebook'
      });
      newUser.save(function() {
        return done(null, newUser);
      });
    });
  }));
};