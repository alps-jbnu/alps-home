var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var studyGroupSchema = new Schema({
    name: String,
    color: String
});
 
module.exports = mongoose.model('studyGroup', studyGroupSchema);