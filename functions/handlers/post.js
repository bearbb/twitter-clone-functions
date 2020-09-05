const { db, admin } = require("../utils/admin");
const { validateTweet } = require("../utils/validators");
exports.getAllPosts = (req, res) => {
  let postData = [];
  db.collection("posts")
    .get()
    .then((doc) => {
      doc.forEach((post) => {
        postData.push(post.data());
      });
      //TODO: if indexes fail then do thing like dat
      postData = postData.sort((p1, p2) => {
        let d1 = new Date(p1.createAt);
        let d2 = new Date(p2.createAt);
        return d2 - d1;
      });
      return res.json(postData);
    });
};

exports.getPost = (req, res) => {
  db.doc(`/posts/${req.params.postId}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(200).json(doc.data());
      } else {
        return res.status(400).json({ post: "not found" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(400)
        .json({ error: "something went wrong pls try again" });
    });
};

exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });
  let imageFileName,
    imageToBeUpload = {};
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(
      Math.random() * 100000000000
    )}.${imageExtension}`;
    const filePath = path.join(os.tmpdir(), imageFileName);
    imageToBeUpload = {
      filePath,
      mimetype,
    };
    file.pipe(fs.createWriteStream(filePath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUpload.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUpload.mimetype,
          },
        },
      })
      .then(() => {
        const imgURL = `https://https://firebasestorage.googleapis.com/v0/b/twitter-clone-53ba9.appspot.com/o/${imageFileName}?alt=media`;
        return res.status(200).json({ imgURL });
      })
      .catch((err) => {
        console.error(err);
        return res.status(400).json({ err });
      });
  });
  busboy.end(req.rawBody);
};
exports.tweet = (req, res) => {
  const tweetData = {
    text: req.body.text,
    image: req.body.image,
    createAt: new Date().toISOString(),
    avatar: req.user.avatar,
    userName: req.user.userName,
    displayName: req.user.displayName,
    verified: false,
    likeCount: 0,
    tweetCount: 0,
    retweetCount: 0,
  };
  const { validate, error } = validateTweet(tweetData);
  if (!validate) {
    return res.status(400).json({ error });
  } else {
    return db
      .collection("posts")
      .add(tweetData)
      .then(() => {
        return res.status(200).json({ tweet: "successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res
          .status(400)
          .json({ error: "Something went wrong, pls try again" });
      });
  }
};
exports.delTweet = (req, res) => {
  let postId = req.params.postId;
  db.doc(`/posts/${postId}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        if (doc.data().userName === req.user.userName) {
          return db.doc(`/posts/${doc.id}`).delete();
        } else {
          return res.status(401).json({ authorization: "Unauthorized" });
        }
      } else {
        return res.status(400).json({ tweet: "Doesn't exist" });
      }
    })
    .then(() => {
      return db.collection("likes").where("postId", "==", postId).get();
    })
    .then((doc) => {
      doc.forEach((like) => {
        db.doc(`/likes/${like.id}`).delete();
      });
      return res.json({ tweet: "Delete successfully" });
    })
    .catch((err) => {
      console.error(err);
    });
};

exports.likePost = (req, res) => {
  //assign req data to a object
  let likeData = {
    createAt: new Date().toISOString(),
    postId: req.params.postId,
    userName: req.user.userName,
    displayName: req.user.displayName,
  };
  const likeDoc = db
    .collection("likes")
    .where("userName", "==", req.user.userName)
    .where("postId", "==", req.params.postId)
    .limit(1);
  //check if post is exists
  const postDoc = db.doc(`/posts/${req.params.postId}`);
  let postData;
  postDoc
    .get()
    .then((doc) => {
      if (doc.exists) {
        postData = doc.data();
        return likeDoc.get();
      } else {
        return res.status(400).json({ post: "Tweet doesn't exist" });
      }
    })
    .then((doc) => {
      if (doc.docs[0]) {
        return res.status(400).json({ like: "Already like this post" });
      } else {
        postData.likeCount += 1;
        return postDoc.update({ likeCount: postData.likeCount }).then(() => {
          return db.collection("likes").add(likeData);
        });
      }
    })
    .then(() => {
      return res.json(postData);
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(400)
        .json({ error: "Something went wrong pls try again" });
    });
};
exports.unlike = (req, res) => {
  //Post document
  let postDoc = db.doc(`/posts/${req.params.postId}`);
  //assign post data
  let postData = {};
  //Like document
  let likeDoc = db
    .collection("likes")
    .where("userName", "==", req.user.userName)
    .where("postId", "==", req.params.postId)
    .limit(1);
  postDoc
    .get()
    .then((doc) => {
      if (doc.exists) {
        postData = doc.data();
        return likeDoc.get();
        //Check if there is like doc then del that doc
      } else {
        return res.status(400).json({
          post: "Tweet not exist",
        });
      }
    })
    .then((doc) => {
      if (doc.docs[0]) {
        let likeId = doc.docs[0].id;
        console.log(likeId);
        return (
          db
            .doc(`/likes/${likeId}`)
            .delete()
            //Update post data by change likeCount -1
            .then(() => {
              postData.likeCount -= 1;
              return postDoc.update({ likeCount: postData.likeCount });
            })
        );
      } else {
        return res.status(400).json({
          like: "Like it first!",
        });
      }
    })

    .then(() => {
      return res.json(postData);
    })
    .catch((error) => {
      console.error(error);
      return res
        .status(400)
        .json({ error: "Something went wrong pls try again" });
    });
};
exports.reply = (req, res) => {
  let postId = req.params.postId;
  let tweetCount;
  let replyData = {
    content: req.body.content,
    createAt: new Date().toISOString(),
    displayName: req.user.displayName,
    image: req.body.image,
    postId,
    userName: req.user.userName,
  };
  //check if post exist
  db.doc(`/posts/${postId}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        tweetCount = doc.data().tweetCount;
        tweetCount += 1;
        return db.collection("replys").add(replyData);
      } else {
        return res.status(400).json({ tweet: "Not Found" });
      }
    })
    .then(() => {
      return db.doc(`/posts/${postId}`).update({ tweetCount });
    })
    .then(() => {
      return res.json(replyData);
    })
    .catch((error) => {
      console.error(error);
      return res
        .status(400)
        .json({ error: "Something went wrong pls try again" });
    });
};
exports.delReply = (req, res) => {
  let postId = req.params.postId;
  let replyId = req.params.replyId;
  let tweetCount;
  db.doc(`/posts/${postId}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        tweetCount = doc.data().tweetCount;
        return db
          .collection("replys")
          .doc(replyId)
          .get()
          .then((repDoc) => {
            if (repDoc.exists) {
              if (repDoc.data().userName === req.user.userName) {
                req.headers = {};
                return db.doc(`/replys/${replyId}`).delete();
              } else {
                return res.status(401).json({ auth: "Unauthorized" });
              }
            } else {
              return res.status(400).json({ reply: "Not found" });
            }
          });
      } else {
        return res.status(400).json({ tweet: "Not found" });
      }
    })
    .then(() => {
      return res.status(200).json({ reply: "Delete successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(400)
        .json({ error: "Something went wrong pls try again" });
    });
};
exports.retweet = (req, res) => {
  let postId = req.params.postId;
  let retweetId, retweetCount;
  let retweetData = {
    content: req.body.content,
    postId,
  };
  //check if that tweet exists
  db.doc(`/posts/${postId}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        retweetCount = doc.data().retweetCount + 1;
        return db
          .collection("retweets")
          .add(retweetData)
          .then((retweetDoc) => {
            retweetId = retweetDoc.id;
            return db.doc(`/posts/${postId}`).update({ retweetCount });
          });
      } else {
        return res.status(400).json({ tweet: "Not found" });
      }
    })
    .then(() => {
      return res.json({ retweet: "Successfully", retweetId });
    })
    .catch((err) => {
      console.error(err);
      return res
        .status(400)
        .json({ error: "Something went wrong pls try again" });
    });
};
exports.delRetweet = (req, res) => {
  let retweetDoc = db.doc(`/retweets/${retweetId}`);
  let retweetCount;

  //check retweet existence
  retweetDoc
    .get()
    .then((rtDoc) => {
      if (rtDoc.exists) {
        //check if that post exists
        let postDoc = db.doc(`/posts/${req.params.postId}`);
        return postDoc.get().then((pDoc) => {
          if (pDoc.exists) {
            retweetCount = pDoc.data().retweetCount - 1;
            return retweetDoc.delete().then(() => {
              return postDoc.update({ retweetCount });
            });
          } else {
            return res.status(400).json({ tweet: "Not found" });
          }
        });
      } else {
        return res.status(400).json({ retweet: "Not found" });
      }
    })
    .then(() => {
      return res.json({ retweet: "Delete successfully" });
    })
    .catch((error) => {
      console.error(error);
      return res
        .status(404)
        .json({ error: "Something went wrong, pls try agin" });
    });
};
