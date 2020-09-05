const {
  validateSignupData,
  validateLoginData,
} = require("../utils/validators");
const authCookieOptions = {
  maxAge: 60000 * 60,
  httpOnly: true,
  secure: true,
  sameSite: "None",
  domain: "asia-east2-twitter-clone-53ba9.cloudfunctions.net",
  path: "/",
};
const { db, admin } = require("../utils/admin");

const firebase = require("firebase");
const firebaseConfig = require("../utils/config");
firebase.initializeApp(firebaseConfig);

exports.signup = async (req, res) => {
  let signupData = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    userName: req.body.userName,
    displayName: req.body.displayName,
    avatar: req.body.avatar,
  };

  const { validate, error } = validateSignupData(signupData);
  if (!validate) {
    return res.status(400).json({ error });
  } else {
    let userId;
    let userDoc = db.doc(`/users/${signupData.userName}`);
    const userData = await userDoc.get();
    if (userData.exists) {
      return res.status(400).json({
        error: {
          userName: "This username is already in used",
        },
      });
    } else {
      try {
        const userCredential = await firebase
          .auth()
          .createUserWithEmailAndPassword(
            signupData.email,
            signupData.password
          );
        userId = userCredential.user.uid;
        const token = await userCredential.user.getIdToken();
        // const refreshToken = userCredential.user.refreshToken;
        if (signupData.avatar === "") {
          signupData.avatar =
            "https://firebasestorage.googleapis.com/v0/b/twitter-clone-53ba9.appspot.com/o/basketball-105-160911.png?alt=media&token=40de82ce-708a-471a-a615-afbf5405ce76";
        }
        const addDataToUser = await db
          .collection("/users")
          .doc(`${signupData.userName}`)
          .set({
            avatar: signupData.avatar,
            createAt: `${new Date().toISOString()}`,
            displayName: signupData.displayName,
            email: signupData.email,
            userId: userId,
            userName: signupData.userName,
          });
        console.log(addDataToUser);
        res.cookie("authorization", `Bearer ${token}`, authCookieOptions);
        return res.json({ account: "Signup successfully" });
      } catch (err) {
        console.log(err.code);
        switch (err.code) {
          case "auth/email-already-in-use":
            return res
              .status(400)
              .json({ error: { email: "Email is already in used" } });
          case "auth/weak-password":
            return res
              .status(400)
              .json({ error: { password: "Password is too weak" } });
          default:
            return res.status(400).json({
              error: { server: "Something went wrong pls try again" },
            });
        }
      }
    }
  }
};

// ----------------------SEPARATOR------------------------------

exports.login = (req, res) => {
  const { validate, error } = validateLoginData(req.body);
  let refreshToken;
  if (!validate) {
    return res.status(400).json({ error });
  } else {
    firebase
      .auth()
      .signInWithEmailAndPassword(req.body.email, req.body.password)
      .then((userCredential) => {
        refreshToken = userCredential.user.refreshToken;
        return userCredential.user.getIdToken();
      })
      .then((token) => {
        res.cookie("authorization", `Bearer ${token}`, authCookieOptions);
        console.log(req.cookies);
        return res.status(200).json({ accessToken: token, refreshToken });
      })
      .catch((err) => {
        if (err.code === "auth/user-not-found") {
          return res.status(400).json({
            error: {
              email: "Wrong email, pls try again",
            },
          });
        } else if (err.code === "auth/week-password") {
          return res.status(400).json({
            error: {
              password: "Wrong password, pls try again",
            },
          });
        } else {
          return res.status(401).json({
            error: {
              error: "Something wrong, pls try again",
            },
          });
        }
      });
  }
};

// -----------------------SEPARATE------------------------

exports.logout = async (req, res) => {
  //Check if there is token from req.cookies
  try {
    if (req.cookies.authorization) {
      //delete the token
      res.clearCookie("authorization", authCookieOptions);
      return res.json({ auth: "Logout successfully" });
    } else {
      return res.status(404).json({ auth: "You haven't logged in" });
    }
  } catch (err) {
    return res.status(400).json({ err });
  }
};

// ---------------------SEPARATE------------------------

exports.user = async (req, res) => {
  //check if that user exists
  let dataDoc = db.doc(`/users/${req.user.userName}`);
  const userData = await dataDoc.get();
  if (userData.exists) {
    return res.json({
      userName: userData.data().userName,
      displayName: userData.data().displayName,
      avatar: userData.data().avatar,
    });
  } else {
    return res.status(404).json({
      error: {
        user: "User not found",
      },
    });
  }
};
