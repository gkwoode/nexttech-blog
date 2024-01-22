const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ForgetPasswordSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resetToken: {
        type: String,
        required: true,
        unique: true
    },
    expireToken: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('ForgetPassword', ForgetPasswordSchema);