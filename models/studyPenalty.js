var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var studyPenaltySchema = new Schema({
    name: String,
    problem: String,
    penalty: Number,
    why: String,
    registered_date: { type: Date, default: Date.now  }
});
 
module.exports = mongoose.model('studyPenalty', studyPenaltySchema);