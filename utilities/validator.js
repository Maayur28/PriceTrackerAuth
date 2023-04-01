const joi = require("joi");
const emailExistence = require("email-existence");
let validator = {};

validator.LoginValidator = (obj) => {
  return true;
  // if (
  //   isNaN(typeof +obj.email / 1) &&
  //   isNaN(typeof +obj.password / 1) &&
  //   obj.email.length > 4 &&
  //   obj.password.length > 7
  // ) {
  //   const schema = joi.object({
  //     email: joi
  //       .string()
  //       .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
  //       .trim()
  //       .required(),
  //     password: joi
  //       .string()
  //       .pattern(
  //         new RegExp(
  //           "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,}$"
  //         )
  //       )
  //       .required(),
  //   });
  //   const { error, value } = schema.validate(obj);
  //   if (error) {
  //     error.message = "Invalid Credentials!!!";
  //     return false;
  //   } else {
  //     return true;
  //   }
  // } else {
  //   return false;
  // }
};

validator.RegisterValidator = (obj) => {
  if (
    isNaN(typeof +obj.name / 1) &&
    isNaN(typeof +obj.email / 1) &&
    isNaN(typeof +obj.gender / 1) &&
    isNaN(typeof +obj.password / 1) &&
    isNaN(typeof +obj.confirmpassword / 1)
  ) {
    const schema = joi.object({
      name: joi.string().required(),
      email: joi.string().email().required(),
      password: joi.string().required(),
      confirmpassword: joi.string().valid(joi.ref("password")).required(),
      gender: joi.string().required(),
    });
    const { error, value } = schema.validate(obj);
    if (error) {
      error.message = "Invalid Credentials!!!";
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
};
validator.TokenValidator = (token) => {
  let obj = { token: token };
  if (isNaN(typeof +obj.token / 1)) {
    const schema = joi.object({
      token: joi.string().required(),
    });
    const { error, value } = schema.validate(obj);
    if (error) {
      error.message = "Invalid Token!!!";
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
};
module.exports = validator;
