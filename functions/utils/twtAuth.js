const { db, admin } = require("./admin");

//Authentication by checking the token in header

module.exports = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    `${req.headers.authorization}`.startsWith("Bearer")
  ) {
    idToken = `${req.headers.authorization}`.split(" ")[1];
  } else {
    console.error("NO TOKEN FOUND");
    return res.status(403).json({ error: "unauthorized" });
  }
  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedIdToken) => {
      req.user = decodedIdToken;
      return db.collection("users").where("userId", "==", req.user.uid).get();
    })
    .then((userData) => {
      req.user.userName = userData.docs[0].data().userName;
      req.user.avatar = userData.docs[0].data().avatar;
      req.user.displayName = userData.docs[0].data().displayName;
      req.user.verified = false; //TODO: add verified on every user data then send it to this
      return next();
    })
    .catch((err) => {
      return res.status(403).json({ authentication: "User not found", err });
    })
    .catch((err) => {
      console.error("error while verified token");
      return res.status(403).json({ err });
    });
};
