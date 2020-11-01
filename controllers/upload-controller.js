const winston = require("winston");
const imageUploadService = require("../services/image-upload-service-s3");
const petService = require("../services/pet-service");
const errorUtil = require("./util/error-util");

const singleUpload = imageUploadService.single("image");

exports.upload = function (req, res) {
  singleUpload(req, res, (err) => {
    if (err) {
      console.log(err);
      return errorUtil.errorRes(res, 400, "Image Upload Error", err.message);
    }

    // multer adds the body fields.
    const imageUrl = req.file.location;
    const petId = req.body.petId;
    petService.addImageToPet(petId, imageUrl);
    winston.info(`Uploaded image ${imageUrl} for pet ${petId}`);

    return res.json({ imageUrl: imageUrl });
  });
};
