const express = require("express");
const cors = require("cors");
const requestLogger = require("./utilities/requestLogger");
const routing = require("./routes/routing");
const errorLogger = require("./utilities/errorLogger");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const emailExistence = require("email-existence");
const otp = require("./middleware/otp");
const app = express();
app.get("/favicon.ico", (req, res) => res.status(204));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(mongoSanitize());
app.use(express.json());
app.use(cookieParser());

app.use(requestLogger);
app.get("/check", (req, res) => {
  emailExistence.check(req.body.email, function (error, response) {
    console.log(response);
  });
});
app.use("/", routing);
app.use(errorLogger);

app.listen(process.env.PORT || 9002, (err) => {
  if (!err) {
    console.log(`Server started at port ${[process.env.PORT || 9002]}`);
  } else {
    console.log(`Error in setting up user server`);
  }
});

module.exports = app;
