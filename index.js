require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const options = {
  all: true,
};

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.static("public"));
const ObjectId = mongoose.Schema.ObjectId;
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
});

let userModel = mongoose.model("user", userSchema);

const exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  userId: ObjectId,
});

let exerciseModel = mongoose.model("exercise", exerciseSchema);
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.post("/api/users", async function (req, res) {
  const { username } = req.body;
  const createdUser = await createAndSaveUser(username);

  res.json({ username: createdUser.username, _id: createdUser._id });
});

app.get("/api/users", async function (req, res) {
  const { username } = req.body;
  const users = await getUsers(username);

  res.send(users);
});

app.post("/api/users/:_id/exercises", async function (req, res) {
  const exercises = req.body;
  const id = req.params._id;
  var user = await getById(id);

  var savedExercise = await saveUserExercise(exercises, id, user.username);

  res.json({
    username: user.username,
    description: savedExercise.description,
    duration: +savedExercise.duration,
    date: savedExercise.date.toDateString(),
    _id: savedExercise.userId,
  });
});

app.get("/api/users/:_id/logs", async function (req, res) {
  const id = req.params._id;
  const queryParams = req.query;
  const userExercises = await getUserExercise(id, queryParams);
  var count = userExercises.length;
  if (count === 0) return res.json({});
  res.json({
    username: userExercises[0].username,
    count: count,
    _id: userExercises[0].userId,
    log: userExercises.map((x) => ({
      description: x.description,
      duration: +x.duration,
      date: x.date.toDateString(),
    })),
  });
});

//DB
const createAndSaveUser = async (username, done) => {
  let userData = new userModel({
    username: username,
  });
  return await userData.save();
};
const getUsers = async () => {
  return await userModel.find({}, "username _id");
};

const getById = async (id) => {
  return await userModel.findById(id).exec();
};
const getUserExercise = async (id, queryParams) => {
  const query = {
    userId: id,
  };
  if (queryParams.from || queryParams.to) {
    query.date = {};
    if (queryParams.from) query.date.$gte = new Date(queryParams.from);
    if (queryParams.to) query.date.$lte = new Date(queryParams.to);
  }
  var data = await exerciseModel
    .find(query, "-_id -__v", { limit: queryParams.limit })
    .exec();
  return data;
};
const saveUserExercise = async (exercises, id, username) => {
  let userData = new exerciseModel({
    username: username,
    description: exercises?.description,
    duration: exercises.duration,
    date: stringDate(exercises.date),
    userId: id,
  });
  return await userData.save();
};

const stringDate = (date) => {
  var validDate = new Date(date).getTime() > 0;

  return validDate ? new Date(date) : new Date();
};
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
