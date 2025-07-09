const mongoose = require('mongoose');

// mongoose.connect("mongodb://127.0.0.1:27017/miniproject"); connect krne ki need isisliye nahi h becz hm already ek file me connect kr chuke h

const postSchema = mongoose.Schema({
   user: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"user"
   },
   date:{
    type: Date,
    default: Date.now
   },
   content: String,
   likes:[ // For arrays
    {type:mongoose.Schema.Types.ObjectId, ref: "user"}
]

})
module.exports = mongoose.model('post',postSchema);