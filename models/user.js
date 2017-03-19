var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    username: String,
    password: String,
    provider: {
        type: String,
        default: 'local',
        getter: getProvider,
        setter: setProvider
    },
    role: {
        type: String,
        default: 'guest'
    },
    
    // local infomations
    firstname : String,
    lastname  : String,
    student_id: String,
    nickname  : {
        type: String,
        getter: getNickname,
        setter: setNickname
    },

    // oauth
    google: Object,
    facebook: Object
});

User.plugin(passportLocalMongoose);

User.virtual('displayName')
    .get(getDisplayName);
    
User.virtual('isAdmin')
    .get(function(){return this.role == 'admin';});

function getDisplayName(){
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

function getProvider(){
    if(this.google) return 'google';
    if(this.facebook) return 'facebook';
    return this.provider;
}

function setProvider(p){
    if( this.google )
        this.provider = 'google';
    else if( this.facebook )
        this.provider = 'facebook';
    else
        this.provider = p || 'local';
}

function getNickname(){
    return this.nickname || getDisplayName();
}

function setNickname(nick){
    if( ! nick )
        this.nickname = getDisplayName();
    else
        this.nickname = nick;
}

module.exports = mongoose.model('User', User);