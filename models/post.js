
const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  content: {
    // Post text content
    type: String,
    default: "",
  },
  media: { type: String }, // filename of photo/video
  mediaType: { type: String }, // "image" or "video"
  likes: [
    // Users who liked this post
    { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  ],
  // Report-specific fields
  isReport: {
    type: Boolean,
    default: false
  },
  reportTitle: { type: String },
  reportCategory: { type: String },
  reportLocation: { type: String },
  reportStatus: {
    type: String,
    enum: ['problemIssued', 'pending', 'resolved'],
    default: 'problemIssued'
  }
});

module.exports = mongoose.model("post", postSchema);
