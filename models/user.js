var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    username: String,
    password: String,
    
    // oauth
    google: Object,
    facebook: Object
});

User.plugin(passportLocalMongoose);

User.virtual('displayName')
    .get(getOAuthDisplayName);

function getOAuthDisplayName(){
    if( this.google ) {
        var name = this.google.name;
        return name.familyName + ' ' + name.givenName;
    }
    else if( this.facebook ) {
        return this.facebook.name;
    } else {
        return this.lastname + ' ' + this.firstname;
    }
}

module.exports = mongoose.model('User', User);