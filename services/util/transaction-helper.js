const mongoose = require("mongoose");

exports.startTransaction = async function () {
  const session = await mongoose.startSession();
  await session.startTransaction();
  return session;
};

exports.abortTransaction = async function (session) {
  await session.abortTransaction();
  session.endSession();
};

exports.commitTransaction = async function (session) {
  await session.commitTransaction();
  await session.endSession();
};
