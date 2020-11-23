class ControllerError extends Error {
  constructor(title, message) {
    super(message);
    this.title = title;
  }
}

module.exports = ControllerError;
