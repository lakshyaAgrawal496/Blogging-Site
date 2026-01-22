const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/miniproject");

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    profilepic: {
        type: String,
        default: "default.jpg"   // Profile picture of user
    },
    posts: [
        { type: mongoose.Schema.Types.ObjectId, ref: "post" }
    ],
    anonId: {
        type: String,
        unique: true
    },
    reports: {
        problemIssued: {
            type: Number,
            default: 0
        },
        pending: {
            type: Number,
            default: 0
        },
        resolved: {
            type: Number,
            default: 0
        }
    }
});

module.exports = mongoose.model('user', userSchema);
