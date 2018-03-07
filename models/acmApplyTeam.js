var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var acmApplyTeamSchema = new Schema({
    name: String,
    phone: String,
    member1_name: String,
    member1_sid: String,
    member1_mail: String,
    member2_name: String,
    member2_sid: String,
    member2_mail: String,
    member3_name: String,
    member3_sid: String,
    member3_mail: String,
    registered_at: {
        type: Date,
        default: Date.now
    },
    ip_address: String
});
 
module.exports = mongoose.model('acmApplyTeam', acmApplyTeamSchema);
