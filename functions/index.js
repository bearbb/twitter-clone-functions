const functions = require("firebase-functions");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = require("express")();
app.use(
  cors({
    origin: "https://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
const { signup, login, logout, user, isLoggedIn } = require("./handlers/user");
const twtAuth = require("./utils/twtAuth");
const {
  getPost,
  uploadImage,
  tweet,
  delTweet,
  getAllPosts,
  likePost,
  unlike,
  reply,
  delReply,
  retweet,
  delRetweet,
  getLikes,
  getLikeData,
} = require("./handlers/post");

//RELATIVE TO POST
app.get("/posts", twtAuth, getAllPosts);
app.get("/post/:postId", getPost);
app.delete("/post/:postId", twtAuth, delTweet);

//INTERACT TO POST
app.post("/post/:postId/like", twtAuth, likePost);
app.post("/post/:postId/unlike", twtAuth, unlike);
app.post("/post/:postId/reply", twtAuth, reply);
app.delete("/post/:postId/:replyId", twtAuth, delReply);
app.post("/post/:postId/retweet", twtAuth, retweet);
app.delete("/retweet/:retweetId", twtAuth, delRetweet);

//RELATIVE TO USER
app.post("/signup", signup);
app.post("/login", login);
app.post("/logout", logout);
app.get("/user", twtAuth, user);
app.get("/isLoggedIn", isLoggedIn);

//RELATIVE TO UPLOAD STUFF TO DATABASE
app.post("/image", twtAuth, uploadImage);
app.post("/tweet", twtAuth, tweet);

//GET ALL LIKES DOC BY USERNAME
app.get("/likes", twtAuth, getLikes);
app.get("/getLikeData/:postId/:userName", getLikeData);
exports.api = functions.region("asia-east2").https.onRequest(app);
