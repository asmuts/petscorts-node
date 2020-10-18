const aws = require("aws-sdk");
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const config = require("config");

aws.config.update({
  secretAccessKey: config.get("aws_secret_access_key"),
  accessKeyId: config.get("aws_access_key_id"),
  region: "us-east-1",
});

const s3 = new aws.S3();

const fileFilter = (req, res, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, null);
  } else {
    cb(new Error("Invalid file type. Only jpeg and png are allowed."), false);
  }
};

const upload = multer({
  storage: multerS3({
    fileFilter,
    s3,
    bucket: "petscorts-dev",
    acl: "public-read",
    cacheControl: "max-age=31536000",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString());
    },
  }),
});

module.exports = upload;
