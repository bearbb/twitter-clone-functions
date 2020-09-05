const { db, admin } = require("../utils/admin");
const validateSignupData = require("../utils/validators");
const signup = async (req, res) => {
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
        if (signupData.avatar === "") {
          signupData.avatar =
            "https://firebasestorage.googleapis.com/v0/b/twitter-clone-53ba9.appspot.com/o/basketball-105-160911.png?alt=media&token=40de82ce-708a-471a-a615-afbf5405ce76";
        }
        const success = await db
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
        return res.json({ account: "Create successfully", token });
      } catch (err) {
        switch (err.code) {
          case "auth/email-already-in-used":
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
