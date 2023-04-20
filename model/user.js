const dbModel = require("../utilities/dbConnection");
const moment = require("moment");
let userModel = {};

userModel.LoginModel = async (userObj) => {
  const model = await dbModel.getUserConnection();
  const verifyEmail = await model.findOne({ email: userObj.email });
  if (verifyEmail) {
    return verifyEmail;
  } else {
    let err = new Error();
    err.status = 404;
    err.message = "You are not registered";
    throw err;
  }
};
userModel.LoginUserIdModel = async (userid) => {
  const model = await dbModel.getUserConnection();
  const verifyEmail = await model.findOne({ userid });
  if (verifyEmail) {
    return verifyEmail;
  } else {
    return false;
  }
};
userModel.LoginStatusUpdate = async (refreshToken, userid) => {
  const model = await dbModel.getUserConnection();
  const verifyUserid = await model.findOne({ userid });
  if (verifyUserid) {
    const updateStatus = await model.updateOne(
      { userid: userid, isVerified: true },
      { $set: { refreshToken: refreshToken, isLoggedIn: true } }
    );
    if (updateStatus.nModified) {
      return true;
    } else {
      let err = new Error();
      err.status = 403;
      err.message = "Your email is not verified!";
      throw err;
    }
  } else {
    let err = new Error();
    err.status = 500;
    err.message = "Server is busy!Please try again later";
    throw err;
  }
};
userModel.RegisterUser = async (userObj) => {
  const model = await dbModel.getUserConnection();
  const checkUser = await model.findOne({ email: userObj.email });
  if (checkUser == null) {
    let insertuser = await model.create(userObj);
    if (insertuser) return true;
    else {
      let err = new Error();
      err.status = 500;
      err.message = "Server is busy! Please try again later";
      throw err;
    }
  } else {
    if (checkUser.isVerified == false) {
      await model.deleteOne({ email: userObj.email });
      let insertuser = await model.create(userObj);
      if (insertuser) return true;
    } else {
      let err = new Error();
      err.status = 400;
      err.message = "Email already exists!!!";
      throw err;
    }
  }
};
userModel.VerifyOtp = async (userid, jwtRefreshToken) => {
  const model = await dbModel.getUserConnection();
  const updateStatus = await model.updateOne(
    { userid: userid },
    {
      $set: {
        isVerified: true,
        isLoggedIn: true,
        refreshToken: jwtRefreshToken,
        otp: "",
        secret: "",
        lastUpdateOn: moment()
          .utcOffset("+05:30")
          .format("MMMM Do YYYY, h:mm:ss a"),
      },
    }
  );
  if (updateStatus.nModified) {
    return await model.findOne({ userid: userid });
  } else {
    let err = new Error();
    err.status = 500;
    err.message = "Server is busy!Please try again later";
    throw err;
  }
};
userModel.forgetPassword = async (userObj) => {
  const model = await dbModel.getUserConnection();
  const checkUser = await model.findOne({ email: userObj.email });
  if (checkUser == null) {
    let err = new Error();
    err.status = 404;
    err.message = "Please enter the registered email!";
    throw err;
  } else {
    let obj = {};
    obj.name = checkUser.name;
    obj.userId = checkUser.userid;
    return obj;
  }
};
userModel.Reset = async (obj) => {
  const model = await dbModel.getUserConnection();
  const updateStatus = await model.updateOne(
    { userid: obj.userid },
    {
      $set: {
        password: obj.password,
        lastUpdateOn: moment()
          .utcOffset("+05:30")
          .format("MMMM Do YYYY, h:mm:ss a"),
      },
    }
  );
  if (updateStatus.nModified) {
    return true;
  } else {
    let err = new Error();
    err.status = 500;
    err.message = "Server is busy!Please try again later";
    throw err;
  }
};
userModel.getProfile = async (userid) => {
  let model = await dbModel.getUserConnection();
  return await model.findOne(
    { userid: userid },
    { name: 1, gender: 1, username: 1, dob: 1, image: 1, _id: 0 }
  );
};
userModel.validateUsername = async (username) => {
  let model = await dbModel.getUserConnection();
  let usernamePresent = await model.findOne({ username: username });
  return usernamePresent ? false : true;
};
userModel.updateProfile = async (userid, obj) => {
  let model = await dbModel.getUserConnection();
  const updateProfile = await model.updateOne(
    { userid: userid, isVerified: true },
    {
      $set: {
        name: obj.name,
        gender: obj.gender,
        username: obj.username,
        dob: obj.dob,
        image: obj.image,
      },
    }
  );
  if (updateProfile.nModified) {
    return await model.findOne(
      { userid: userid },
      { name: 1, gender: 1, username: 1, dob: 1, image: 1, _id: 0 }
    );
  } else {
    let err = new Error();
    err.status = 500;
    err.message = "Server is busy!Please try again later";
    throw err;
  }
};

const checkIfAlreadyExists = (productArray, product) => {
  let alreadyExists = false;
  if (
    productArray != null &&
    productArray !== undefined &&
    productArray.size != 0
  ) {
    for (let i = 0; i < productArray.length; i++) {
      let element = productArray[i];
      if (element.title === product.title && element.url === product.url) {
        alreadyExists = true;
        break;
      }
    }
    return alreadyExists;
  }
};

userModel.addTracker = async (userObj) => {
  const model = await dbModel.getUserConnection();
  const verifyUserid = await model.findOne({ userid: userObj.userid });
  const alreadyExists = checkIfAlreadyExists(
    verifyUserid.products,
    userObj.product
  );
  if (!alreadyExists) {
    const added = await model.updateOne(
      { userid: userObj.userid, isVerified: true },
      { $addToSet: { products: userObj.product } }
    );
    if (added.nModified > 0) {
      return true;
    } else {
      let err = new Error();
      err.status = 500;
      err.message = "Server is busy!Please try again later";
      throw err;
    }
  } else {
    const updated = await model.updateOne(
      {
        userid: userObj.userid,
        isVerified: true,
        "products.url": userObj.product.url,
      },
      { $set: { "products.$.alertPrice": userObj.product.alertPrice } }
    );
    if (updated.ok > 0) {
      return true;
    } else {
      let err = new Error();
      err.status = 500;
      err.message = "Server is busy!Please try again later";
      throw err;
    }
  }
};

userModel.getTracker = async (userid, page, limit) => {
  const model = await dbModel.getUserConnection();
  const data = await model.findOne({ userid: userid }, { products: 1, _id: 0 });
  let start = (parseInt(page) - 1) * parseInt(limit),
    end = parseInt(limit) + start;
  let obj = {};
  if (
    data != null &&
    data != undefined &&
    data.products != null &&
    data.products != undefined &&
    data.products.length > 1
  ) {
    data.products = data.products.reverse();
    obj.total = data.products.length;
    obj.currentPage = page;
    obj.limit = limit;
    obj.products = data.products.slice(start, end);
  }
  return obj;
};

const checkIfTrackerExists = (productArray, productId) => {
  let alreadyExists = false;
  if (
    productArray != null &&
    productArray !== undefined &&
    productArray.size != 0
  ) {
    for (let i = 0; i < productArray.length; i++) {
      let element = productArray[i];
      if (element.productId === productId) {
        alreadyExists = true;
        break;
      }
    }
    return alreadyExists;
  }
};

userModel.updateTracker = async (userObj, page, limit) => {
  const model = await dbModel.getUserConnection();
  const verifyUserid = await model.findOne({ userid: userObj.userid });
  const alreadyExists = checkIfTrackerExists(
    verifyUserid.products,
    userObj.productId
  );
  if (alreadyExists) {
    const added = await model.updateOne(
      {
        userid: userObj.userid,
        isVerified: true,
        "products.productId": userObj.productId,
      },
      { $set: { "products.$.alertPrice": userObj.alertPrice } }
    );
    if (added.nModified > 0) {
      return await userModel.getTracker(userObj.userid, page, limit);
    } else {
      let err = new Error();
      err.status = 500;
      err.message = "Server is busy!Please try again later";
      throw err;
    }
  } else {
    let err = new Error();
    err.status = 404;
    err.message = "Not Found!!!";
    throw err;
  }
};

userModel.updateEmailSentPrice = async (userObj) => {
  const model = await dbModel.getUserConnection();
  const updated = await model.updateOne(
    {
      email: userObj.email,
      isVerified: true,
      "products.productId": userObj.productId,
    },
    { $set: { "products.$.emailSentPrice": userObj.emailSentPrice } }
  );
  if (updated.nModified > 0) {
    return true;
  } else {
    return false;
  }
};

userModel.removeTracker = async (userObj, page, limit) => {
  const model = await dbModel.getUserConnection();
  const verifyUserid = await model.findOne({ userid: userObj.userid });
  const alreadyExists = checkIfTrackerExists(
    verifyUserid.products,
    userObj.productId
  );
  if (alreadyExists) {
    const deleted = await model.update(
      {
        userid: userObj.userid,
        isVerified: true,
      },
      { $pull: { products: { productId: userObj.productId } } },
      {
        upsert: false, // Upsert
        multi: true, // Multi
      }
    );
    if (deleted.nModified > 0) {
      return await userModel.getTracker(userObj.userid, page, limit);
    } else {
      let err = new Error();
      err.status = 500;
      err.message = "Server is busy!Please try again later";
      throw err;
    }
  } else {
    let err = new Error();
    err.status = 404;
    err.message = "Not Found!!!";
    throw err;
  }
};

userModel.getUsersList = async () => {
  const model = await dbModel.getUserConnection();
  const usersList = await model.find({}, { email: 1, products: 1, _id: 0 });
  return usersList;
};

userModel.addNotifyData = async (email, notifyData) => {
  const model = await dbModel.getUserConnection();
  const verifyEmail = await model.findOne({ email: email });
  if (verifyEmail) {
    const added = await model.updateOne(
      { email: email, isVerified: true },
      {
        $push: {
          notification: {
            $each: notifyData,
            $position: 0,
          },
        },
      }
    );
    if (added.nModified > 0) {
      return true;
    } else {
      let err = new Error();
      err.status = 500;
      err.message = "Server is busy!Please try again later";
      throw err;
    }
  }
};

userModel.getNotifications = async (userid) => {
  const model = await dbModel.getUserConnection();
  const notification = await model.findOne(
    { userid: userid },
    { notification: 1, _id: 0 }
  );
  return notification;
};

module.exports = userModel;
