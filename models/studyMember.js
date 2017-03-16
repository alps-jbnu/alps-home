var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var studyMemberSchema = new Schema({
    name: String,
    handle: String,
    penalty: {
        type: Number,
        default: 0
    },
    group: {
        type: Schema.ObjectId,
        ref: 'studyGroup'
    }
});
 
module.exports = mongoose.model('studyMember', studyMemberSchema);