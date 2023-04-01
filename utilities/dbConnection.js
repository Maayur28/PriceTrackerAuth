const mongoose = require("mongoose");
const moment = require("moment");
mongoose.Promise = global.Promise;
require("dotenv").config();

const url = process.env.MONGODB_URL;
const options = {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

const PriceSchema = mongoose.Schema({
  originalPrice: {
    type: Number,
    required: [true, "Original Price is required"],
  },
  discountPrice: {
    type: Number,
    required: [true, "Discount Price is required"],
  },
});

const RatingSchema = mongoose.Schema({
  ratingCount: {
    type: String,
    required: [true, "Rating Count is required"],
  },
  totalRated: {
    type: String,
    required: [true, "Total Rated is required"],
  },
});

const ProductsSchema = mongoose.Schema({
  productId: { type: String, required: [true, "Product Id is required"] },
  title: { type: String, required: [true, "Title is required"] },
  price: { type: { PriceSchema }, required: [true, "FirstName is required"] },
  url: { type: String, required: [true, "Url is required"] },
  image: { type: String },
  badge: { type: String },
  rating: { type: { RatingSchema } },
  alertPrice: { type: Number },
});

const userSchema = mongoose.Schema(
  {
    userid: {
      type: String,
      required: [true, "userid is required"],
      unique: true,
    },
    email: { type: String, required: [true, "Email is required"] },
    name: { type: String, required: [true, "FirstName is required"] },
    username: { type: String },
    image: { type: String },
    gender: { type: String, required: [true, "Gender is required"] },
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    password: { type: String, required: [true, "Password is required"] },
    refreshToken: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    accountCreatedOn: {
      type: String,
    },
    lastUpdatedOn: {
      type: String,
      required: [true, "Please update time"],
    },
    otp: { type: Number },
    products: [ProductsSchema],
    secret: { type: String },
  },
  { timestamps: true }
);

userSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 300, partialFilterExpression: { isVerified: false } }
);

let connection = {};
connection.getUserConnection = async () => {
  try {
    let dbConnection = await mongoose.connect(url, options);
    let model = dbConnection.model("users", userSchema);
    return model;
  } catch (error) {
    let err = new Error("Could not establish connection with user database");
    err.status = 500;
    throw err;
  }
};
module.exports = connection;
