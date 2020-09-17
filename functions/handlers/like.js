const { db } = require("../utils/admin");

exports.likePost = async (req, res) => {
  let likeData = {
    createAt: new Date().toISOString(),
    postId: req.params.postId,
    userName: req.user.userName,
    displayName: req.user.displayName,
  };
  const postDoc = db.doc(`/posts/${likeData.postId}`);
  const likeDoc = db
    .collection("posts/")
    .doc(likeData.postId)
    .collection("likes")
    .where("userName", "==", likeData.userName)
    .limit(1);
  try {
    let postData = await postDoc.get();
    //check if post exist
    if (postData.exists) {
      //check if already liked
      const likeData = await likeDoc.get();
      if (!likeData.exists) {
        postData = postData.data();
        postData.likeCount += 1;
        const addLikeDoc = db
          .doc(`/posts/${likeData.postId}`)
          .collection("likes")
          .add(likeData);
        const updateTweetCount = db
          .doc(`/posts/${likeData.postId}`)
          .update({ likeCount: likeData.likeCount });
        const [add, update] = await Promise.all([addLikeDoc, updateTweetCount]);
        return res.json({ like: "Successfully" });
      } else {
        return res.status(404).json({ like: "Already like this tweet" });
      }
    } else {
      return res.status(404).json({ tweet: "Tweet doesn't exist" });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(400)
      .json({ error: "Something went wrong, pls try again" });
  }
};

exports.unlike = async (req, res) => {
  const postId = req.params.postId;
  const postDoc = db.doc(`/posts/${postId}`);
  const likeDoc = db
    .doc(`/posts/${postId}`)
    .collection("likes")
    .where("userName", "==", req.user.userName)
    .limit(1);
  try {
    //check if post exist
    const postData = await postDoc.get();
    if (postData.exists) {
      const likeData = likeDoc.get().docs[0];
      const likeId = likeData.id;
      if (likeData.exists) {
        let likeCount = postData.data().likeCount - 1;
        const delLikeDoc = db.doc(`/posts/${postId}/likes/${likeId}`).delete();
        const updateLikeCount = db
          .doc(`/posts/${postId}`)
          .update({ likeCount });
        const [del, update] = await Promise.all([delLikeDoc, updateLikeCount]);
        return res.json({ like: "Delete successfully" });
      } else {
        return res.status(400).json({
          like: "U have to like it first",
        });
      }
    } else {
      return res.status(400).json({
        tweet: "Tweet doesn't exist",
      });
    }
  } catch (err) {
    return res
      .status(400)
      .json({ error: "Something went wrong, pls try again" });
  }
};
