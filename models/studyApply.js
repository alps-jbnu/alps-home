var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var studyApplySchema = new Schema({
    name: String,
    creator: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    start_date: Date,
    end_date: Date,
    registered_date: {
        type: Date,
        default: Date.now
    },
    members: [
        {
            type: Schema.ObjectId,
            ref: 'User'
        }
    ],
    available: {
        type: Boolean,
        default: true
    }
});
 
module.exports = mongoose.model('studyApply', studyApplySchema);