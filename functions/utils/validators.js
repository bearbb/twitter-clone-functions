const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
exports.validateLoginData = (loginData) => {
  if (loginData.email === "") {
    return {
      validate: false,
      error: {
        email: "Email can't be blank",
      },
    };
  } else if (!emailRegEx.test(loginData.email)) {
    return {
      validate: false,
      error: { email: "Email is not in correct form" },
    };
  } else if (loginData.password === "") {
    return {
      validate: false,
      error: {
        confirmPassword: "Password can't be blank",
      },
    };
  } else {
    return {
      validate: true,
    };
  }
};
exports.validateSignupData = (signupData) => {
  //so basically req will contain (email, password, confirmPassword, userName )
  //1ST: check if email is in correct form by using regular expression regEx => if not return json with email: error
  //1.1ST: check id email is already in used => return {email : already in used} TODO: check it in the user.js later
  //2ST: check if two password is the same => if not return json with {confirmPassword: error}
  //3RD: check if userName is avail(already exist) => return json with {userName: error} //check in the user.js
  //ALL PASS: return a token
  if (signupData.email === "") {
    return {
      validate: false,
      error: {
        email: "Email can't be blank",
      },
    };
  } else if (!emailRegEx.test(signupData.email)) {
    return {
      validate: false,
      error: { email: "Email is not in correct form" },
    };
  } else if (signupData.password !== signupData.confirmPassword) {
    return {
      validate: false,
      error: {
        confirmPassword: "Confirm password is not the same",
      },
    };
  } else if (signupData.displayName === "") {
    return {
      validate: false,
      error: {
        displayName: "Your name can't be blank",
      },
    };
  } else if (signupData.userName === "") {
    return {
      validate: false,
      error: {
        userName: "Username can't be blank",
      },
    };
  } else if (signupData.password === "") {
    return {
      validate: false,
      error: {
        password: "Password can't be blank",
      },
    };
  } else if (signupData.confirmPassword === "") {
    return {
      validate: false,
      error: {
        confirmPassword: "Password confirmation can't be blank",
      },
    };
  } else {
    return {
      validate: true,
      error: {},
    };
  }
};
exports.validateTweet = ({ text, image }) => {
  if (text === "" && image === "") {
    return {
      validate: false,
      error: {
        tweet: "U can't tweet a empty tweet",
      },
    };
  } else {
    return {
      validate: true,
      error: {},
    };
  }
};
