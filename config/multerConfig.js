const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
    //yaha file ka folder setup ho rha h
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },
    //yaha file ka name setup ho rha h
    filename: function (req, file, cb) {
        crypto.randomBytes(12,function(err,bytes){
            const fn = bytes.toString("hex") + path.extname(file.originalname) // bytes.toString("hex"): Ye random hex me convert kr dega name ko && path.extname(): img file ki extension extract krke dega i.ex jpeg, png etc
            cb(null, fn);
        })
    }
  })
const upload = multer({ storage: storage })

module.exports = upload;

