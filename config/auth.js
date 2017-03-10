// config/auth.js

var config = require('./');

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : 'your-secret-clientID-here', // your App ID
        'clientSecret'  : 'your-client-secret-here', // your App Secret
        'callbackURL'   : 'http://localhost:8080/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'       : 'your-consumer-key-here',
        'consumerSecret'    : 'your-client-secret-here',
        'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : '400423535862-j75k0lt2or8vrfathgol851ekd87djgg.apps.googleusercontent.com',
        'clientSecret'  : 'h73TIxDcZTQ4Cy_ETYiGhIGm',
        'callbackURL'   : config.domain + '/auth/google/return'
    }
};