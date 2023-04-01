const speakeasy = require("speakeasy");

otpObj = {};
otpObj.generateOtp = () => {
  const secret = speakeasy.generateSecret({ length: 20 });
  const token = speakeasy.time({
    secret: secret.base32,
    encoding: "base32",
    step: 300,
    window: 0,
  });
  let obj = {};
  obj.secret = secret.base32;
  obj.token = token;
  return obj;
};

otpObj.verifyOtp = (secret, token) => {
  const tokenValidates = speakeasy.time.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    step: 300,
    window: 0,
  });
  return tokenValidates;
};
module.exports = otpObj;
