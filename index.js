const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const { ErrorMiddleware } = require("./middlewares/Error");
const sls = require("serverless-http");
const cors = require('cors');
const path = require('path');


app.use('/download', express.static(path.join(__dirname, 'public')));
app.use('/backend/uploads', express.static('uploads'));
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://vinayak-associates.vercel.app",
      "http://127.0.0.1:3000",
      "http://13.200.166.86",
      "http://195.35.23.185",
      "ws://localhost:8080",
      "ws://195.35.23.185:8080"
    ],
    credentials: true,
  })
);

app.use('/uploads', express.static('uploads'));
// load config from env file
require("dotenv").config();
const PORT = process.env.PORT || 4000;

//middleware to parse json request body
app.use(express.json());
app.use(cookieParser());

//import routes
const route = require("./routes/route");

//mount the todo API routes
app.use("/backend/api/v1", route);

module.exports.handler = sls(app);

//start serve
const server = app.listen(PORT, () => {
  console.log(`Server started Successfully at ${PORT}`);
});

server.setTimeout(0);

app.use(ErrorMiddleware);

const dbConnect = require("./config/database");
dbConnect();
