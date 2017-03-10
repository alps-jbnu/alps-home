var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    username: String,
    password: String,
    provider: {
        type: String,
        default: 'local'
    },
    
    // local infomations
    firstname : String,
    lastname  : String,
    student_id: String,

    // oauth
    google: Object,
    facebook: Object
});

User.plugin(passportLocalMongoose);

User.virtual('displayName')
    .get(getOAuthDisplayName);

function getOAuthDisplayName(){
    var provider = this.provider;
    if( provider == 'google' || this.google ) {
        var name = this.google.name;
        return name.familyName + ' ' + name.givenName;
    }
    else if( provider == 'facebook' || this.facebook ) {
        return this.facebook.displayName;
    } else {
        return this.lastname + ' ' + this.firstname;
    }
}

module.exports = mongoose.model('User', User);