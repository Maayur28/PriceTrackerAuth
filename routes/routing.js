const express = require("express");
const authObj = require("../middleware/auth");
const service = require("../services/user");
const routes = express.Router();
const fetch = require("isomorphic-fetch");
const sendMailObj = require("../middleware/sendMail");
require("dotenv").config();

routes.post("/login", async (req, res, next) => {
  try {
    let { accessToken, jwtRefreshToken, name, image } =
      await service.LoginService(req.body, req.headers["user-agent"]);
    res.status(200);
    res.json({ accessToken, jwtRefreshToken, name, image });
  } catch (error) {
    next(error);
  }
});

routes.post("/register", async (req, res, next) => {
  try {
    let authToken = await service.RegisterService(req.body);
    res.status(200);
    res.json({ authToken });
  } catch (error) {
    next(error);
  }
});

routes.post("/verifyotp", authObj.authOtp, async (req, res, next) => {
  try {
    if (req.status) {
      const { accessToken, jwtRefreshToken, name, image } =
        await service.VerifyOtp(req.userid);
      return res
        .json({ accessToken, jwtRefreshToken, name, image })
        .status(200);
    } else {
      return res.json({ sessionId: false }).status(400);
    }
  } catch (error) {
    next(error);
  }
});
routes.post("/verifyaccess", authObj.auth, async (req, res) => {
  try {
    if (req.access) {
      res
        .json({ accessToken: req.accessToken, userid: req.userid })
        .status(200);
    } else {
      res.json({ accessToken: false }).status(400);
    }
  } catch (error) {
    next(error);
  }
});
routes.post("/forgetpassword", async (req, res, next) => {
  try {
    let status = await service.forgetPassword(req.body);
    res.json({ status }).status(200);
  } catch (error) {
    next(error);
  }
});
routes.post("/reset", authObj.verifyJwt, async (req, res, next) => {
  try {
    if (req.body.status) {
      if (req.body.password) await service.Reset(req.body);
      res.json({ status: true }).status(200);
    } else {
      return res.json({ status: false }).status(400);
    }
  } catch (error) {
    next(error);
  }
});
routes.post("/contact", async (req, res, next) => {
  try {
    if (!req.body.captcha) return res.json({ success: false }).status(400);
    if (await service.verifyCaptcha(req)) {
      await service.sendContactMail(req.body);
      return res.json({ success: true }).status(200);
    } else {
      return res.json({ success: false }).status(200);
    }
  } catch (error) {
    next(error);
  }
});
routes.get("/getprofile/:userid", async (req, res, next) => {
  try {
    let profile = await service.getProfile(req.params.userid);
    res.json({ profile }).status(200);
  } catch (error) {
    next(error);
  }
});
routes.get("/validateusername/:username", async (req, res, next) => {
  try {
    let verified = await service.validateUsername(req.params.username);
    res.json({ verified }).status(200);
  } catch (error) {
    next(error);
  }
});
routes.put("/updateprofile/:userid", async (req, res, next) => {
  try {
    let profile = await service.updateProfile(req.params.userid, req.body);
    res.json({ profile }).status(200);
  } catch (error) {
    next(error);
  }
});
routes.post("/changepassword/:userid", async (req, res, next) => {
  try {
    let status = await service.changePassword(req.params.userid, req.body);
    res.json({ status }).status(200);
  } catch (error) {
    next(error);
  }
});
routes.get("/", async (req, res, next) => {
  try {
    res.json("Ping Successful").status(200);
  } catch (error) {
    next(error);
  }
});

routes.post("/addtracker", authObj.auth, async (req, res, next) => {
  try {
    if (req.access) {
      let userObj = {};
      userObj.userid = req.userid;
      userObj.product = req.body;
      let status = await service.addTracker(userObj);
      res.json({ status }).status(200);
    } else {
      res.json({ accessToken: false }).status(400);
    }
  } catch (error) {
    next(error);
  }
});

routes.post("/gettracker", authObj.auth, async (req, res, next) => {
  try {
    if (req.access) {
      let data = await service.getTracker(req.userid);
      res.json({ data: data }).status(200);
    } else {
      res.json({ accessToken: false }).status(400);
    }
  } catch (error) {
    next(error);
  }
});

routes.put("/updatetracker", authObj.auth, async (req, res, next) => {
  try {
    if (req.access) {
      let userObj = {};
      userObj.userid = req.userid;
      userObj.productId = req.body.productId;
      userObj.alertPrice = req.body.alertPrice;
      let data = await service.updateTracker(userObj);
      res.json({ data: data }).status(200);
    } else {
      res.json({ accessToken: false }).status(400);
    }
  } catch (error) {
    next(error);
  }
});

routes.put("/updateEmailSentPrice", async (req, res, next) => {
  try {
    let data = await service.updateEmailSentPrice(req.body);
    res.json({ data: data }).status(200);
  } catch (error) {
    next(error);
  }
});

routes.put("/deletetracker", authObj.auth, async (req, res, next) => {
  try {
    if (req.access) {
      let userObj = {};
      userObj.userid = req.userid;
      userObj.productId = req.body.productId;
      let data = await service.removeTracker(userObj);
      res.json({ data: data }).status(200);
    } else {
      res.json({ accessToken: false }).status(400);
    }
  } catch (error) {
    next(error);
  }
});

routes.get(`/${process.env.USERS_ROUTE}`, async (req, res, next) => {
  try {
    if (req.query.key === process.env.KEY) {
      let data = await service.getUsersList();
      res.json({ data: data }).status(200);
    } else {
      res.json({ message: "Access Denied" }).status(403);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = routes;
