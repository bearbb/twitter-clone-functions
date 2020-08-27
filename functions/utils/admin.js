const admin = require("firebase-admin");

let key = require("../key/key.json");
admin.initializeApp({
  credential: admin.credential.cert(key),
  databaseURL: "https://twitter-clone-53ba9.firebaseio.com",
  storageBucket: "twitter-clone-53ba9.appspot.com",
});

const db = admin.firestore();
module.exports = { db, admin };
