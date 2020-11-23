const winston = require("winston");
const { upload } = require("../services/image-upload-service-s3");
const petService = require("../services/pet-service");
const errorUtil = require("./util/error-util");

const singleUpload = upload.single("image");

exports.upload = async function (req, res) {
  await singleUpload(req, res, async (err) => {
    if (err) {
      console.log(err);
      return errorUtil.errorRes(res, 400, "Image Upload Error", err.message);
    }

    // multer adds the body fields.
    if (!req.file || !req.file.location) {
      const message = "Req from upload serice is missing a file location";
      console.log(message);
      return errorUtil.errorRes(res, 400, "Image Upload Error", message);
    }
    const imageUrl = req.file.location;
    const petId = req.body.petId;
    winston.info(`Uploaded image ${imageUrl} for pet ${petId}`);

    const { pet, err: errPetUpdate } = await petService.addImageToPet(
      petId,
      imageUrl
    );
    if (errPetUpdate) {
      winston.info(`Failed to update pet record ${errPetUpdate}`);
      // TODO should return an error
    }

    return res.json({ imageUrl: imageUrl });
  });
};
