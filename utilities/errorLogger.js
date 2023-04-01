const fs = require("fs");
const moment = require("moment");

const errorLogger = (err, req, res, next) => {
  let data = `Date- ${moment().format("MMMM Do YYYY, h:mm:ss a")} Error- ${
    err.stack
  }\n`;
  fs.appendFile("/errorLogger.txt", data, (error) => {
    if (error) {
      console.log("Failed in Logging the error");
    }
  });
  if (err.status) res.status(err.status);
  else res.status(500);
  res.send(err.message);
};
module.exports = errorLogger;
