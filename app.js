/*To do:
1. Register and Login
2. Logout
3. Post Creation
4. Post like
5. Post delete (Access to owner only)
*/
const express = require('express');
const app = express();

const userModel = require("./models/user");
const postModel = require("./models/post");

const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
// const multer = require('multer'); 
// const multerconfig = require('./config/multerConfig');
const upload = require('./config/multerConfig');

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());


// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, './public/images/uploads')
//     },
//     filename: function (req, file, cb) {
//         crypto.randomBytes(12,function(err,bytes){
//             const fn = bytes.toString("hex") + path.extname(file.originalname) // bytes.toString("hex"): Ye random hex me convert kr dega name ko && path.extname(): img file ki extension extract krke dega i.ex jpeg, png etc
//             cb(null, fn);
//         })
//     }
//   })
// const upload = multer({ storage: storage })


app.get('/',(req,res)=>{
    res.render('index');
});

app.get('/profile/upload',(req,res)=>{
    res.render('profileupload');
});

app.post('/upload', isLoggedIn, upload.single("image"), async (req,res)=>{
    // console.log(req.file);
    let user = await userModel.findOne({email: req.user.email});
    user.profilepic = req.file.filename;
    await user.save();
    res.redirect("/profile");
});

app.post('/register', async (req,res)=>{
    let {email, password,username,name,age} = req.body;
    let user = await userModel.findOne({email});
    if(user) return res.status(500).send("User already registered"); //500 is an HTTP status code for Internal Server Error. You're using 500 when the user already exists, which is not really a server error.

    bcrypt.genSalt(10,(err,salt) => { // bcrypt.genSalt(): used to generate a cryptographic salt. A salt is a random string added to a password before hashing it. Makes every hash unique, even for the same password.
                                        //Syntax: bcrypt.genSalt(rounds, callback) Number of hashing rounds (a.k.a. cost factor).More rounds = more secure = slower hashing

        bcrypt.hash(password,salt, async (err,hash) => {
            let user = await userModel.create({
                username,
                email,
                age,
                name,
                password: hash
            });

            let token = jwt.sign({email: email, userid: user._id }, "shhh"); //Syntax: jwt.sign(Object, secretOrPrivateKey);
            res.cookie("token",token);
            res.send("Registered!");
        })
    })
});

app.get('/login', (req,res)=>{
    res.render("login")
})

app.post('/post', isLoggedIn, async (req,res)=>{ // isLoggedIn is middleware: When we go to profile route, 1st it go to is LoggedIn middleware to check is it really loggedIn
    let user = await userModel.findOne({email:req.user.email});
    let{content} = req.body
    
    let post = await postModel.create({
        user: user._id,
        content
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile")
});

app.get('/profile', isLoggedIn, async (req,res)=>{ // isLoggedIn is middleware: When we go to profile route, 1st it go to is LoggedIn middleware to check is it really loggedIn
    let user = await userModel.findOne({email:req.user.email}).populate("posts");
    res.render("profile", { user: user });
})

app.get('/like/:id', isLoggedIn, async (req,res)=>{ // isLoggedIn is middleware: When we go to profile route, 1st it go to is LoggedIn middleware to check is it really loggedIn
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    
    if(post.likes.indexOf(req.user.userid)=== -1){
        post.likes.push(req.user.userid);
    }

    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1); //splice() removes the like, 1 denotes kitne like remove krne h i.e 1
    }
    
    await post.save();
    res.redirect("/profile");
})

app.get('/edit/:id', isLoggedIn, async (req,res)=>{ // isLoggedIn is middleware: When we go to profile route, 1st it go to is LoggedIn middleware to check is it really loggedIn
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    
    res.render("edit",{post});

})

app.post('/update/:id', isLoggedIn, async (req,res)=>{ // isLoggedIn is middleware: When we go to profile route, 1st it go to is LoggedIn middleware to check is it really loggedIn
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});
    
    res.redirect("/profile");

})

app.post('/login', async (req,res)=>{
    let {email, password,username} = req.body;
    let user = await userModel.findOne({email});
    if(!user) return res.status(500).send("Something went Wrong");

    bcrypt.compare(password,user.password, function(err,result){
        if(result) {
            let token = jwt.sign({email: email, userid: user._id }, "shhh");
            res.cookie("token",token);
            res.status(200).redirect("/profile");
        }
        else res.redirect("/login");
    })
});

app.get('/logout', (req,res)=>{
    res.cookie("token",""); //Token ko blank cookie me convert kr dete h jisse koi cookie nahi bachti => No data
    res.redirect("/login");
})

//Middleware to create protected route
function isLoggedIn(req,res, next){
    if(req.cookies.token === "") 
        res.redirect("/login") ;
    else{
        let data = jwt.verify(req.cookies.token,"shhh");
        req.user = data;
        next();
    }
}

app.listen(3000);