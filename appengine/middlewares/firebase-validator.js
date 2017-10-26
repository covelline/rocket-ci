const firebase = require("firebase")
const nestedError = require("../lib/nestedError")

/**
  firebase の ID token を検証する middleware
  指定された uid のユーザーとして認証されているか確かめる

  post の body に入っている json 文字列の
  firebaseToken を検証する
  {
    firebaseToken: <firebase id token>
  }
 */
module.exports = function firebaseValidator(req, res, next) {
  const { firebaseToken } = req.body

  // id token が指定されていない場合は 401 エラー
  if (!firebaseToken) {
    res.status(401).json({ error: "must provide firebase id token" })
    return
  }

  firebase.auth()
    .verifyIdToken(firebaseToken)
    .then(decodedToken => {
      const { uid } = decodedToken
      req.body.firebaseUID = uid

      next()
    }).catch(error => {
      // verifyIdToken に失敗した場合は 403 エラー
      res.status(403).send(nestedError(error, "Forbidden"))
    })
}
