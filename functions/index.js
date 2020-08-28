const functions = require("firebase-functions");

const app = require("express")();
const { db } = require("./utils/admin");

const { signup, login } = require("./handlers/user");
const twtAuth = require("./utils/twtAuth");
const {
  getPost,
  uploadImage,
  tweet,
  getAllPosts,
  likePost,
  unlike,
} = require("./handlers/post");

//RELATIVE TO POST
app.get("/posts", getAllPosts);
app.get("/post/:postId", getPost);

//INTERACT TO POST
app.post("/post/:postId/like", twtAuth, likePost);
app.post("/post/:postId/unlike", twtAuth, unlike);

//RELATIVE TO USER
app.post("/signup", signup);
app.post("/login", login);

//RELATIVE TO UPLOAD STUFF TO DATABASE
app.post("/image", twtAuth, uploadImage);
app.post("/tweet", twtAuth, tweet);

//tTest
exports.api = functions.region("asia-east2").https.onRequest(app);
