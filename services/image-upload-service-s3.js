const aws = require("aws-sdk");
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const config = require("config");
const winston = require("winston");

// TODO get from config
const bucketName = "petscorts-dev";

aws.config.update({
  secretAccessKey: config.get("aws_secret_access_key"),
  accessKeyId: config.get("aws_access_key_id"),
  region: "us-east-1",
});

const s3 = new aws.S3();

// the key should not start with a /
// the root is no slash
function removeImageFromS3(imageKey) {
  s3.deleteObject(
    {
      Bucket: bucketName,
      Key: imageKey,
    },
    function (err, data) {
      winston.error(
        `Error removing image ${imageKey} from S3 bucket ${bucketName}`,
        err
      );
    }
  );
  winston.info(`Removed image ${imageKey} from S3 bucket ${bucketName}`);
}

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
    bucket: bucketName,
    acl: "public-read",
    cacheControl: "max-age=31536000",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + file.originalname);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 2, // <=2 MB files
  },
});

module.exports = { upload, removeImageFromS3 };
