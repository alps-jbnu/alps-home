var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var studyProblemSchema = new Schema({
    problem_id: String,
    problem_title: String,
    target_group: {
        type: Schema.ObjectId,
        ref: 'studyGroup'
    },
    start_date: Date,
    end_date: Date
});
 
module.exports = mongoose.model('studyProblem', studyProblemSchema);