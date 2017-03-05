var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var memberSchema = new Schema({
    name: String,
    phone: String,
    how: String,
    comment: String,
    status: { type: Number, default: 0 },
    registered_date: { type: Date, default: Date.now  }
});
 
module.exports = mongoose.model('waitMember', memberSchema);