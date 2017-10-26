module.exports = function firebaseValidator(req, res, next) {
  req.body.firebaseUID = "uid"
  next()
}
