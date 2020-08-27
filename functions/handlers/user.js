const {
  validateSignupData,
  validateLoginData,
  validateTweet,
} = require("../utils/validators");
const { db, admin } = require("../utils/admin");

const firebase = require("firebase");
const firebaseConfig = require("../utils/config");
firebase.initializeApp(firebaseConfig);

exports.signup = (req, res) => {
  let signupData = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    userName: req.body.userName,
    displayName: req.body.displayName,
    avatar: req.body.avatar,
  };
  const { validate, error } = validateSignupData(signupData);

  //if not valid then return error
  if (!validate) {
    return res.status(400).json({ error });
  } else {
    let userId;
    db.collection("users")
      .where("userName", "==", signupData.userName)
      .limit(1)
      .get()
      .then((doc) => {
        if (doc.exists) {
          return res.json({ userName: "This username is already in used" });
        } else {
          return firebase
            .auth()
            .createUserWithEmailAndPassword(
              signupData.email,
              signupData.password
            );
        }
      })
      .catch((err) => {
        console.error(err);
        return res.status(400).json({ err });
      })
      .then((userCredential) => {
        userId = userCredential.user.uid;
        return userCredential.user.getIdToken();
      })
      .then((token) => {
        if (signupData.avatar === "") {
          signupData.avatar =
            "https://firebasestorage.googleapis.com/v0/b/twitter-clone-53ba9.appspot.com/o/basketball-105-160911.png?alt=media&token=40de82ce-708a-471a-a615-afbf5405ce76";
        }
        return db
          .collection("/users")
          .doc(`${signupData.userName}`)
          .set({
            avatar: signupData.avatar,
            createAt: `${new Date().toISOString()}`,
            displayName: signupData.displayName,
            email: signupData.email,
            userId: userId,
            userName: signupData.userName,
          })
          .then(() => {
            return res.json({ account: "Create successfully", token });
          })
          .catch((err) => {
            console.error(err);
            return res.status(400).json({ err });
          });
      })
      .catch((err) => {
        if (err.code == "auth/email-already-in-used") {
          return res.status(400).json({ email: "Email is already in used" });
        } else {
          console.error(err);
          return res
            .status(400)
            .json({ server: "Something went wrong, please try again" });
        }
      });
  }
};
exports.login = (req, res) => {
  const { validate, error } = validateLoginData(req.body);
  if (!validate) {
    return res.status(400).json({ error });
  } else {
    firebase
      .auth()
      .signInWithEmailAndPassword(req.body.email, req.body.password)
      .then((userCredential) => {
        return userCredential.user.getIdToken();
      })
      .then((token) => {
        return res.status(200).json({ token });
      })
      .catch((err) => {
        if (err.code === "auth/user-not-found") {
          return res.status(400).json({
            email: "Wrong email, pls try again",
          });
        } else if (err.code === "auth/wrong-password") {
          return res.status(400).json({
            password: "Wrong password, pls try again",
          });
        } else {
          return res.status(401).json({
            error: "Something wrong, pls try again",
          });
        }
      });
  }
};
