const fs = require("fs");
const moment = require("moment");
const requestLogger = (req, res, next) => {
  let data = `Date- ${moment().format("MMMM Do YYYY, h:mm:ss a")}  Method=${
    req.method
  } Url=${req.url}\n`;
  fs.appendFile("/requestLogger.txt", data, (err) => {
    if (err) {
      return next(err);
    }
  });
  next();
};
module.exports = requestLogger;
