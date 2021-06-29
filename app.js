const express = require("express");
const app = express();
const multer = require("multer");
const upload = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png") {
      cb(new Error("File type is not supported"), false);
      return;
    }
    cb(null, true);
  },
});

//MS Specific
const axios = require("axios").default;
const async = require("async");
const fs = require("fs");
const https = require("https");
const path = require("path");
const createReadStream = require("fs").createReadStream;
const sleep = require("util").promisify(setTimeout);
const ComputerVisionClient =
  require("@azure/cognitiveservices-computervision").ComputerVisionClient;
const ApiKeyCredentials = require("@azure/ms-rest-js").ApiKeyCredentials;

require("dotenv").config({ path: "./config/.env" });

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const key = process.env.MS_COMPUTER_VISION_SUBSCRIPTION_KEY;
const endpoint = process.env.MS_COMPUTER_VISION_ENDPOINT;
const faceEndpoint = process.env.MS_FACE_ENDPOINT;
const subscriptionKey = process.env.MS_FACE_SUB_KEY;

const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { "Ocp-Apim-Subscription-Key": key } }),
  endpoint
);

//Server Setup
app.set("view engine", "ejs");
app.use(express.static("public"));

//Routes
app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.post("/", upload.single("file-to-upload"), async (req, res) => {
  try {
    let hotDogCount = 0;
    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);
    const imageUrl = result.secure_url;

    axios({
      method: 'post',
      url: faceEndpoint,
      params : {
          
          returnFaceId: true,
          returnFaceAttributes: 'age,gender,headPose,smile,facialHair,glasses,' +
          'emotion,hair,makeup,occlusion,accessories,blur,exposure,noise'
      },
      data: {
          url: imageUrl,
      },
      headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey }
  }).then(function (response) {
      console.log('Status text: ' + response.status)
      console.log('Status text: ' + response.statusText)
      console.log(response.data[0])
      res.render("result.ejs", { data: response.data[0].faceAttributes.emotion, img: imageUrl });
  }).catch(function (error) {
      console.log(error)
  });
  } catch (err) {
    console.log(err);
  }
});

app.listen(process.env.PORT || 8000);
