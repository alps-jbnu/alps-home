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

function getList(query, sortQuery, callback){
    return this
        .find(query || {})
        .sort(sortQuery || {})
        .populate('group')
        .exec(callback)
    ;
}

studyMemberSchema.statics.getList = getList;
 
module.exports = mongoose.model('studyMember', studyMemberSchema);