
/*
 * causeError と message から以下のようなオブジェクトを作る.
 * 返る値は Error クラスのオブジェクトではないので注意.
 * {
 *  message: message,
 *  cause: {
 *    message: causeError.message
 *  }
 * }
 */
module.exports = function(causeError, message) {

  const cause = {
    message: causeError.message
  }

  // cause にコピーしたいプロパティを並べる
  const propNames = [
    "code",
    "status"
  ]
  propNames.forEach(name => {
    if (causeError[name]) {
      cause[name] = causeError[name]
    }
  })

  return {
    message,
    cause
  }
}

