// const model = require("../models/user");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const validator = require("../utilities/validator");
const model = require("../model/user");
const moment = require("moment");
const CryptoJS = require("crypto-js");
const otpObj = require("../middleware/otp");
const sendMailObj = require("../middleware/sendMail");
const DeviceDetector = require("node-device-detector");
const { default: axios } = require("axios");
const util = require("../utilities/util");
require("dotenv").config();
let userService = {};

const detector = new DeviceDetector({
  clientIndexes: true,
  deviceIndexes: true,
  deviceAliasCode: false,
});

userService.LoginService = async (userObj, userAgent) => {
  try {
    if (validator.LoginValidator(userObj)) {
      const getUser = await model.LoginModel(userObj);
      if (getUser) {
        if (await bcrypt.compare(userObj.password, getUser.password)) {
          delete userObj.password;
          const getUserId = getUser.userid;
          if (getUserId) {
            const jwtAccessToken = jwt.sign(
              {
                userid: getUserId,
              },
              process.env.TOKEN_SECRET,
              { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY_TIME }
            );
            const jwtRefreshToken = jwt.sign(
              { userid: getUserId },
              process.env.TOKEN_SECRET,
              { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY_TIME }
            );
            if (jwtAccessToken && jwtRefreshToken) {
              const accessToken = CryptoJS.AES.encrypt(
                jwtAccessToken,
                process.env.CIPHER_TOKEN
              ).toString();
              if (accessToken) {
                const userLoginStatus = await model.LoginStatusUpdate(
                  jwtRefreshToken,
                  getUserId
                );
                if (userLoginStatus) {
                  const result = detector.detect(userAgent);
                  await sendMailObj.sendLoginMail(
                    result.client.name,
                    result.client.type,
                    result.device.type,
                    userObj.email
                  );
                  let name = getUser.name;
                  if (name && name.indexOf(" ") > 0) {
                    name = name.substring(0, name.indexOf(" "));
                  }
                  if (name && name.length > 8) {
                    name = name.substring(0, 8);
                  }
                  let image = getUser.image;
                  return { accessToken, jwtRefreshToken, name, image };
                } else {
                  let err = new Error();
                  err.status = 500;
                  err.message = "Server is busy!Please try again later";
                  throw err;
                }
              } else {
                let err = new Error();
                err.status = 503;
                err.message =
                  "Unexpected error occured! Please try again later";
                throw err;
              }
            } else {
              let err = new Error();
              err.status = 503;
              err.message = "Unexpected error occured! Please try again later";
              throw err;
            }
          } else {
            let err = new Error();
            err.status = 500;
            err.message = "Server is busy! Please try again later";
            throw err;
          }
        } else {
          delete userObj.password;
          let err = new Error();
          err.status = 401;
          err.message = "Invalid username or password";
          throw err;
        }
      } else {
        let err = new Error();
        err.status = 404;
        err.message = "Invalid username or password";
        throw err;
      }
    } else {
      npm;
      let err = new Error();
      err.status = 400;
      err.message = "Invalid credentials!!!";
      throw err;
    }
  } catch (error) {
    let err = new Error();
    err.status = 400;
    err.message = error.message || "Invalid credentials!!!";
    throw err;
  }
};

userService.RegisterService = async (userObj) => {
  try {
    const valid = await validator.RegisterValidator(userObj);
    if (valid) {
      userObj.userid = uuidv4();
      userObj = _.pick(userObj, [
        "userid",
        "name",
        "email",
        "password",
        "gender",
      ]);
      userObj.password = await bcrypt.hash(
        userObj.password,
        await bcrypt.genSalt(11)
      );
      const jwtAccessToken = jwt.sign(
        {
          userid: userObj.userid,
        },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.JWT_VERIFY_ACCESS_TOKEN_EXPIRY_TIME }
      );
      if (jwtAccessToken) {
        userObj.accountCreatedOn = moment()
          .utcOffset("+05:30")
          .format("MMMM Do YYYY, h:mm:ss a");
        userObj.lastUpdatedOn = moment()
          .utcOffset("+05:30")
          .format("MMMM Do YYYY, h:mm:ss a");
        const obj = otpObj.generateOtp();
        userObj.secret = obj.secret;
        userObj.otp = obj.token;
        const registerStatus = await model.RegisterUser(userObj);
        if (registerStatus) {
          const sessionToken = CryptoJS.AES.encrypt(
            jwtAccessToken,
            process.env.CIPHER_TOKEN
          ).toString();
          await sendMailObj.sendOtpMail(userObj.name, userObj.email, obj.token);
          return sessionToken;
        } else {
          let err = new Error();
          err.status = 500;
          err.message = "Server is busy! Please try again later";
          throw err;
        }
      } else {
        let err = new Error();
        err.status = 500;
        err.message = "Server is busy! Please try again later";
        throw err;
      }
    } else {
      let err = new Error();
      err.status = 400;
      err.message = "Invalid credentials!!!";
      throw err;
    }
  } catch (error) {
    let err = new Error();
    err.status = 400;
    err.message = error.message || error || "Invalid credentials!!!";
    throw err;
  }
};

userService.VerifyOtp = async (userid) => {
  const jwtAccessToken = jwt.sign(
    {
      userid: userid,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY_TIME }
  );
  const jwtRefreshToken = jwt.sign(
    { userid: userid },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY_TIME }
  );
  if (jwtAccessToken && jwtRefreshToken) {
    let getUser = await model.VerifyOtp(userid, jwtRefreshToken);
    if (getUser) {
      let accessToken = CryptoJS.AES.encrypt(
        jwtAccessToken,
        process.env.CIPHER_TOKEN
      ).toString();
      let name = getUser.name;
      name = name.split(" ")[0];
      name = name.substring(0, 8);
      let image = getUser.image;
      return { accessToken, jwtRefreshToken, name, image };
    } else {
      let err = new Error();
      err.status = 500;
      err.message = "Server is busy! Please try again later";
      throw err;
    }
  } else {
    let err = new Error();
    err.status = 500;
    err.message = "Server is busy! Please try again later";
    throw err;
  }
};
userService.verifyAccess = async (accessToken) => {
  return accessToken;
};
userService.forgetPassword = async (email) => {
  let userObj = await model.forgetPassword(email);
  const jwtAccessToken = jwt.sign(
    {
      userid: userObj.userId,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.JWT_VERIFY_ACCESS_TOKEN_EXPIRY_TIME }
  );
  await sendMailObj.sendResetMail(email.email, userObj.name, jwtAccessToken);
  return true;
};
userService.Reset = async (userObj) => {
  userObj.password = await bcrypt.hash(
    userObj.password,
    await bcrypt.genSalt(11)
  );
  return await model.Reset(userObj);
};
userService.getProfile = async (userid) => {
  return await model.getProfile(userid);
};
userService.validateUsername = async (username) => {
  if (username.trim().length >= 5) {
    return await model.validateUsername(username);
  } else return false;
};
userService.updateProfile = async (userid, obj) => {
  return await model.updateProfile(userid, obj);
};
userService.changePassword = async (userid, obj) => {
  const getUser = await model.LoginUserIdModel(userid);
  if (getUser && obj.password === obj.confirmpassword) {
    if (await bcrypt.compare(obj.currentpassword, getUser.password)) {
      let newPassword = await bcrypt.hash(
        obj.password,
        await bcrypt.genSalt(11)
      );
      let userObj = {};
      userObj.password = newPassword;
      userObj.userid = userid;
      return await model.Reset(userObj);
    } else return false;
  } else return false;
};

userService.sendContactMail = async (obj) => {
  await sendMailObj.sendContactMail(obj);
};

userService.verifyCaptcha = async (req) => {
  const secretKey = process.env.CAPTCHA_SECRET_KEY;
  const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body.captcha}`;
  const response = await axios.post(verifyURL);
  return response.data.success;
};

userService.addTracker = async (obj) => {
  obj.product.productId = uuidv4();
  let URL = obj.product.url;
  let domain = URL.replace(/.+\/\/|www.|\..+/g, "");
  if (domain != null || domain != undefined || domain != "") {
    domain = domain.toUpperCase();
    switch (domain) {
      case "AMAZON":
        obj.product.url = util.shortenAmazonURL(URL);
        break;
      case "FLIPKART":
        obj.product.url = util.shortenFlipkartURL(URL);
        break;
      default:
        obj.product.url = URL;
        break;
    }
  }
  return await model.addTracker(obj);
};

userService.getTracker = async (userid) => {
  return await model.getTracker(userid);
};

userService.updateTracker = async (obj) => {
  return await model.updateTracker(obj);
};

userService.updateEmailSentPrice = async (obj) => {
  return await model.updateEmailSentPrice(obj);
};

userService.removeTracker = async (obj) => {
  return await model.removeTracker(obj);
};

userService.getUsersList = async () => {
  return await model.getUsersList();
};

module.exports = userService;
