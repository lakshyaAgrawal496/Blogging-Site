const express = require("express");
const app = express();

const userModel = require("./models/user");
const postModel = require("./models/post");

const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
// const multer = require('multer');
// const multerconfig = require('./config/multerConfig');
const upload = require("./config/multerConfig");
const multer = require("multer");
const cors = require("cors");

// --- Ensure generateAnonId is defined before registration route ---
function generateAnonId() {
  return "anon-" + Math.random().toString(36).substr(2, 8);
}

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));


app.get("/", async (req, res) => {
  // Redirect to feed as the landing page
  res.redirect("/feed");
});

// Show upload form
app.get("/profile/upload", isLoggedIn, (req, res) => {
  res.render("profileupload");
});

// Handle pfp upload
app.post("/upload", isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }

    // Find the current user
    const user = await userModel.findOne({ email: req.user.email });

    // Save uploaded filename into DB
    user.profilepic = req.file.filename;
    await user.save();

    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

app.post("/register", async (req, res) => {
  let { email, password, username, name, age } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send("User already registered"); //500 is an HTTP status code for Internal Server Error. You're using 500 when the user already exists, which is not really a server error.

  bcrypt.genSalt(10, (err, salt) => {
    // bcrypt.genSalt(): used to generate a cryptographic salt. A salt is a random string added to a password before hashing it. Makes every hash unique, even for the same password.
    //Syntax: bcrypt.genSalt(rounds, callback) Number of hashing rounds (a.k.a. cost factor).More rounds = more secure = slower hashing

    bcrypt.hash(password, salt, async (err, hash) => {
      let anonId;
      // Ensure anonId is unique
      while (true) {
        anonId = generateAnonId();
        const existing = await userModel.findOne({ anonId });
        if (!existing) break;
      }
      // console.log("Generated anonId:", anonId); // Debug log
      try {
        let user = await userModel.create({
          username,
          email,
          age,
          name,
          password: hash,
          anonId,
        });
        let token = jwt.sign({ anonId: user.anonId, userid: user._id }, "shhh");
        res.cookie("token", token);
        res.send("Registered!");
      } catch (err) {
        console.error("User creation error:", err);
        res.status(500).send("Error creating user");
      }
    });
  });
});

app.get("/register", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/post", isLoggedIn, upload.single("media"), async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email });

    // text part
    let { content } = req.body;

    // determine mediaType (image/video) if file exists
    let mediaType = null;
    if (req.file) {
      const ext = req.file.mimetype.split("/")[0]; // "image" or "video"
      mediaType = ext;
    }

    // create new post
    let post = await postModel.create({
      user: user._id,
      content,
      media: req.file ? req.file.filename : null,
      mediaType,
    });

    user.posts.push(post._id);
    await user.save();

    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.send("Error while creating post");
  }
});

app.get("/profile", isLoggedIn, async (req, res) => {
  // isLoggedIn is middleware: When we go to profile route, 1st it go to is LoggedIn middleware to check is it really loggedIn
  let user = await userModel
    .findOne({ _id: req.user.userid })
    .populate("posts");
  
  // Ensure reports object exists with default values
  if (!user.reports) {
    user.reports = {
      problemIssued: 0,
      pending: 0,
      resolved: 0
    };
    await user.save();
  }
  
  console.log("Profile - User:", user.anonId);
  console.log("Profile - Total posts:", user.posts.length);
  console.log("Profile - Report posts:", user.posts.filter(post => post.isReport).length);
  console.log("Profile - Reports:", user.reports);
  
  res.render("profile", { user: user });
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
  // isLoggedIn is middleware: When we go to profile route, 1st it go to is LoggedIn middleware to check is it really loggedIn
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1); //splice() removes the like, 1 denotes kitne like remove krne h i.e 1
  }

  await post.save();
  const back = req.get("referer") || "/profile";
  res.redirect(back);
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  try {
    // Find the post by id and ensure the logged-in user is the owner
    let post = await postModel.findOne({ _id: req.params.id });

    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Only allow editing if the logged-in user is the owner of the post
    if (post.user.toString() !== req.user.userid) {
      return res.status(403).send("You are not authorized to edit this post");
    }

    res.render("edit", { post });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading post for editing");
  }
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
  // isLoggedIn is middleware: When we go to profile route, 1st it go to is LoggedIn middleware to check is it really loggedIn
  let post = await postModel.findOneAndUpdate(
    { _id: req.params.id },
    { content: req.body.content }
  );

  res.redirect("/profile");
});

app.get("/delete/:id", isLoggedIn, async (req, res) => {
  try {
    // Find the post by id
    let post = await postModel.findOne({ _id: req.params.id });

    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Only allow deletion if the logged-in user is the owner of the post
    if (post.user.toString() !== req.user.userid) {
      return res.status(403).send("You are not authorized to delete this post");
    }

    await postModel.deleteOne({ _id: req.params.id });
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting post");
  }
});

app.get("/post/:id", isLoggedIn, async (req, res) => {
  const post = await postModel.findById(req.params.id).populate("user");
  if (!post) return res.status(404).send("Post not found");
  res.render("post", { post, currentUserId: req.user.userid });
});

app.post("/login", async (req, res) => {
  let { email, password, username } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) return res.status(500).send("Something went Wrong");

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "shhh");
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else res.redirect("/login");
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", ""); //Token ko blank cookie me convert kr dete h jisse koi cookie nahi bachti => No data
  res.redirect("/feed");
});

//Middleware to create protected route
function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") res.redirect("/login");
  else {
    let data = jwt.verify(req.cookies.token, "shhh");
    req.user = data;
    next();
  }
}

// --- Add a script to update existing users without anonId ---
app.get("/admin/fix-anonids", async (req, res) => {
  // WARNING: This should be protected in production!
  const users = await userModel.find({ anonId: { $exists: false } });
  let updated = 0;
  for (const user of users) {
    let anonId;
    while (true) {
      anonId = generateAnonId();
      const existing = await userModel.findOne({ anonId });
      if (!existing) break;
    }
    user.anonId = anonId;
    await user.save();
    updated++;
  }
  res.send(`Updated ${updated} users with anonId.`);
});

app.get("/feed", async (req, res) => {
  const posts = await postModel.find({}).populate("user").sort({ _id: -1 });
  let currentUserId = null;
  try {
    if (req.cookies && req.cookies.token) {
      const data = jwt.verify(req.cookies.token, "shhh");
      currentUserId = data.userid || null;
    }
  } catch (e) {
    currentUserId = null;
  }
  res.render("feed", { posts, currentUserId });
});

// Report creation routes
app.get("/create-report", isLoggedIn, (req, res) => {
  res.render("create-report");
});

app.post("/create-report", isLoggedIn, upload.single("media"), async (req, res) => {
  try {
    const { title, description, category, location } = req.body;
    console.log("Creating report:", { title, description, category, location });
    console.log("File uploaded:", req.file ? req.file.originalname : "No file");
    
    // Find the current user
    const user = await userModel.findOne({ _id: req.user.userid });
    console.log("Found user:", user.anonId);
    
    // Create a post for the report
    let post = await postModel.create({
      user: user._id,
      content: `🚨 REPORT: ${title}\n\n${description}\n\n📍 Location: ${location}\n🏷️ Category: ${category}`,
      media: req.file ? req.file.filename : null,
      mediaType: req.file ? req.file.mimetype.split("/")[0] : null,
      isReport: true,
      reportTitle: title,
      reportCategory: category,
      reportLocation: location,
      reportStatus: 'Pending'
    });
    console.log("Created post:", post._id, "isReport:", post.isReport);

    // Add post to user's posts array
    user.posts.push(post._id);
    
    // Increment the problemIssued count
    user.reports.problemIssued += 1;
    await user.save();
    console.log("Updated user reports:", user.reports);
    
    res.redirect("/profile");
  } catch (err) {
    console.error("Error creating report:", err);
    res.status(500).send("Error creating report: " + err.message);
  }
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send('File too large. Maximum size is 50MB.');
    }
  }
  if (error.message === 'Only images and videos are allowed!') {
    return res.status(400).send('Only images and videos are allowed!');
  }
  next(error);
});

// Admin route to update report status (for testing)
app.get("/admin/update-report/:userId/:status", async (req, res) => {
  try {
    const { userId, status } = req.params;
    const user = await userModel.findOne({ _id: userId }).populate("posts");
    
    if (!user) {
      return res.status(404).send("User not found");
    }
    
    // Find the most recent report post
    const reportPost = user.posts
      .filter(post => post.isReport && post.reportStatus === 'problemIssued')
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    if (!reportPost) {
      return res.status(404).send("No report found to update");
    }
    
    // Move from problemIssued to pending or resolved
    if (status === "pending" && user.reports.problemIssued > 0) {
      user.reports.problemIssued -= 1;
      user.reports.pending += 1;
      reportPost.reportStatus = 'pending';
    } else if (status === "resolved" && user.reports.pending > 0) {
      user.reports.pending -= 1;
      user.reports.resolved += 1;
      reportPost.reportStatus = 'resolved';
    }
    
    await user.save();
    await reportPost.save();
    res.send(`Report status updated to ${status} for post: ${reportPost.reportTitle}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating report status");
  }
});

// --- API Routes for React Frontend ---

app.post("/api/register", async (req, res) => {
  let { email, password, username, name, age } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(400).json({ error: "User already registered" });

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let anonId;
      while (true) {
        anonId = generateAnonId();
        const existing = await userModel.findOne({ anonId });
        if (!existing) break;
      }
      try {
        let user = await userModel.create({
          username,
          email,
          age,
          name,
          password: hash,
          anonId,
        });
        let token = jwt.sign({ anonId: user.anonId, userid: user._id }, "shhh");
        res.cookie("token", token, { httpOnly: true, secure: false }); // secure: true in production
        res.json({ success: true, token, user });
      } catch (err) {
        console.error("User creation error:", err);
        res.status(500).json({ error: "Error creating user" });
      }
    });
  });
});

app.post("/api/login", async (req, res) => {
  let { username, password, email } = req.body;
  
  // Try finding by username first
  let user = await userModel.findOne({ username });
  
  // If not found, try finding by email (in case user entered email in username field)
  if (!user && username) {
      user = await userModel.findOne({ email: username });
  }
  if (!user && email) {
      user = await userModel.findOne({ email });
  }
  
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      let token = jwt.sign({ email: user.email, userid: user._id }, "shhh");
      res.cookie("token", token, { httpOnly: true, secure: false });
      res.json({ success: true, token, user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
});

app.get("/api/feed", async (req, res) => {
  const posts = await postModel.find({}).populate("user").sort({ _id: -1 });
  let currentUserId = null;
  try {
    if (req.cookies && req.cookies.token) {
      const data = jwt.verify(req.cookies.token, "shhh");
      currentUserId = data.userid || null;
    }
  } catch (e) {
    currentUserId = null;
  }
  res.json({ posts, currentUserId });
});

app.get("/api/profile", isLoggedIn, async (req, res) => {
  let user = await userModel
    .findOne({ _id: req.user.userid })
    .populate("posts");
  
  if (!user.reports) {
    user.reports = {
      problemIssued: 0,
      pending: 0,
      resolved: 0
    };
    await user.save();
  }
  res.json({ user });
});

app.post("/api/create-report", isLoggedIn, upload.single("media"), async (req, res) => {
  try {
    const { title, description, category, location } = req.body;
    const user = await userModel.findOne({ _id: req.user.userid });
    
    let post = await postModel.create({
      user: user._id,
      content: `🚨 REPORT: ${title}\n\n${description}\n\n📍 Location: ${location}\n🏷️ Category: ${category}`,
      media: req.file ? req.file.filename : null,
      mediaType: req.file ? req.file.mimetype.split("/")[0] : null,
      isReport: true,
      reportTitle: title,
      reportCategory: category,
      reportLocation: location,
      reportStatus: 'Pending'
    });

    user.posts.push(post._id);
    user.reports.problemIssued += 1;
    await user.save();
    
    res.json({ success: true, post });
  } catch (err) {
    console.error("Error creating report:", err);
    res.status(500).json({ error: "Error creating report" });
  }
});

app.get("/api/logout", (req, res) => {
  res.cookie("token", "");
  res.json({ success: true });
});

app.post("/api/admin/update-report", async (req, res) => {
  try {
    const { reportId, status, action } = req.body;
    const post = await postModel.findOne({ _id: reportId }).populate("user");
    
    if (!post) {
      return res.status(404).json({ error: "Report not found" });
    }
    
    const user = post.user;
    const oldStatus = post.reportStatus;
    
    // Update counts if status changed
    if (oldStatus !== status) {
      // Decrement old status count
      if (oldStatus === 'problemIssued' && user.reports.problemIssued > 0) user.reports.problemIssued--;
      else if (oldStatus === 'pending' && user.reports.pending > 0) user.reports.pending--; // Note: 'pending' in frontend maps to 'pending' in backend? Backend has 'problemIssued', 'pending', 'resolved'.
      // Frontend has 'Pending', 'In Progress', 'Resolved'.
      // Mapping:
      // Frontend 'Pending' -> Backend 'problemIssued' (default)
      // Frontend 'In Progress' -> Backend 'pending'
      // Frontend 'Resolved' -> Backend 'resolved'
      
      // Let's standardize.
      // If frontend sends 'Pending', it means 'problemIssued'.
      // If frontend sends 'In Progress', it means 'pending'.
      // If frontend sends 'Resolved', it means 'resolved'.
      
      // Wait, app.js line 323: `reportStatus: 'problemIssued'`.
      // App.jsx line 28 maps `post.reportStatus || "Pending"`.
      
      // Let's stick to backend terms for storage, and map in frontend?
      // Or update backend to use frontend terms?
      // Backend schema has `problemIssued`, `pending`, `resolved`.
      // I should map them.
      
      const statusMap = {
        'Pending': 'problemIssued',
        'In Progress': 'pending',
        'Resolved': 'resolved'
      };
      
      const reverseStatusMap = {
        'problemIssued': 'Pending',
        'pending': 'In Progress',
        'resolved': 'Resolved'
      };
      
      // Actually, let's just use what frontend sends and map it to backend fields for counts.
      // But `post.reportStatus` stores the string.
      // If I store "In Progress", existing logic might break if it expects "pending".
      // But existing logic is minimal.
      
      // I'll update the post status to whatever frontend sends, but for user counts I need to be careful.
      // User schema has `problemIssued`, `pending`, `resolved`.
      
      // Let's map:
      // 'Pending' -> problemIssued
      // 'In Progress' -> pending
      // 'Resolved' -> resolved
      
      const getBackendStatus = (s) => {
        if (s === 'Pending') return 'problemIssued';
        if (s === 'In Progress') return 'pending';
        if (s === 'Resolved') return 'resolved';
        return s; // fallback
      };

      const oldBackendStatus = getBackendStatus(oldStatus); // oldStatus might be 'problemIssued' already
      // Wait, post.reportStatus stores 'problemIssued' initially.
      // So oldStatus is likely 'problemIssued'.
      
      // If new status is 'In Progress', backend status is 'pending'.
      const newBackendStatus = getBackendStatus(status);
      
      // Decrement old
      if (user.reports[oldBackendStatus] > 0) user.reports[oldBackendStatus]--;
      
      // Increment new
      if (user.reports[newBackendStatus] !== undefined) user.reports[newBackendStatus]++;
    }
    
    post.reportStatus = status; // Store the frontend status string directly? Or backend one?
    // If I store "In Progress", then next time I fetch it, I need to know it maps to 'pending' for counts.
    // Better to store consistent values.
    // Let's store the frontend values 'Pending', 'In Progress', 'Resolved' in `reportStatus` for display,
    // but map to `problemIssued`, `pending`, `resolved` for user stats.
    
    // But wait, `app.js` line 323 sets `reportStatus: 'problemIssued'`.
    // So initially it is 'problemIssued'.
    // If I change it to 'Pending', it's inconsistent.
    
    // I will store 'Pending', 'In Progress', 'Resolved' in `reportStatus`.
    // And I will update `create-report` to set `reportStatus: 'Pending'`.
    // And I will update user schema counts to match? No, user schema has specific keys.
    
    // Okay, plan:
    // 1. Update `create-report` to set `reportStatus: 'Pending'`.
    // 2. Map 'Pending' -> 'problemIssued' for user counts.
    // 3. Map 'In Progress' -> 'pending' for user counts.
    // 4. Map 'Resolved' -> 'resolved' for user counts.
    
    // I'll update `create-report` in app.js as well.
    
    post.action = action;
    await post.save();
    await user.save();
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating report" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
