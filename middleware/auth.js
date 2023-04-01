const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const validator = require("../utilities/validator");
const otpObj = require("./otp");
const dbModel = require("../utilities/dbConnection");
const modell = require("../model/user");
require("dotenv").config();

authObj = {};

authObj.auth = async (req, res, next) => {
  const token = req.body.accessToken;
  const refreshtoken = req.body.refreshToken;
  if (token && refreshtoken) {
    let decode, refdecode;
    if (validator.TokenValidator(token)) {
      const ciphertext = token;
      let jwttoken = CryptoJS.AES.decrypt(ciphertext, process.env.CIPHER_TOKEN);
      jwttoken = jwttoken.toString(CryptoJS.enc.Utf8);
      if (!jwttoken) {
        let err = new Error();
        err.status = 400;
        err.message = "Access denied!Please login";
        throw err;
      } else {
        try {
          refdecode = jwt.verify(refreshtoken, process.env.TOKEN_SECRET);
          decode = jwt.verify(jwttoken, process.env.TOKEN_SECRET);
          req.accessToken = token;
          req.userid = decode.userid;
          req.access = true;
          next();
        } catch (error) {
          if (refdecode) {
            const jwtAccessToken = jwt.sign(
              {
                userid: refdecode.userid,
              },
              process.env.TOKEN_SECRET,
              { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY_TIME }
            );
            if (jwtAccessToken) {
              const cipherToken = CryptoJS.AES.encrypt(
                jwtAccessToken,
                process.env.CIPHER_TOKEN
              ).toString();
              if (cipherToken) {
                req.accessToken = cipherToken;
                req.userid = refdecode.userid;
                req.access = true;
                next();
              } else {
                let err = new Error();
                err.status = 503;
                err.message =
                  "Unexpected error occured! Please try again later";
                next(err);
              }
            } else {
              let err = new Error();
              err.status = 503;
              err.message = "Unexpected error occured! Please try again later";
              next(err);
            }
          } else {
            req.access = false;
            next(error);
          }
        }
      }
    } else {
      let err = new Error();
      err.status = 400;
      err.message = "Please login to continue!!!";
      next(err);
    }
  } else {
    let err = new Error();
    err.status = 400;
    err.message = "Please login to continue!!!";
    next(err);
  }
};
authObj.authOtp = async (req, res, next) => {
  try {
    const token = req.body.sessionId;
    const otp = req.body.otp;
    if (token && otp) {
      if (validator.TokenValidator(token)) {
        let jwttoken = CryptoJS.AES.decrypt(token, process.env.CIPHER_TOKEN);
        jwttoken = jwttoken.toString(CryptoJS.enc.Utf8);
        if (!jwttoken) {
          req.status = false;
          next(error);
        } else {
          try {
            const decode = jwt.verify(jwttoken, process.env.TOKEN_SECRET);
            if (decode) {
              const model = await dbModel.getUserConnection();
              const secret = await model.findOne(
                { userid: decode.userid },
                { secret: 1, _id: 0 }
              );
              if (secret) {
                if (otpObj.verifyOtp(secret.secret, otp)) {
                  req.status = true;
                  req.userid = decode.userid;
                  next();
                } else {
                  req.status = false;
                  next();
                }
              } else {
                let err = new Error();
                err.status = 500;
                err.message = "Server is busy!Please try again later";
                throw err;
              }
            } else {
              let err = new Error();
              err.status = 400;
              err.message = "Invalid Request!";
              throw err;
            }
          } catch (error) {
            next(error);
          }
        }
      } else {
        let err = new Error();
        err.status = 400;
        err.message = "Invalid Request!";
        next(err);
      }
    } else {
      req.status = false;
      next(error);
    }
  } catch (error) {
    req.status = false;
    next(error);
  }
};
authObj.verifyJwt = async (req, res, next) => {
  try {
    let jwttoken = req.body.token;
    const decode = jwt.verify(jwttoken, process.env.TOKEN_SECRET);
    if (decode) {
      req.body.status = true;
      req.body.userid = decode.userid;
      next();
    } else {
      req.status = false;
      next();
    }
  } catch (error) {
    req.status = false;
    next(error);
  }
};
module.exports = authObj;
