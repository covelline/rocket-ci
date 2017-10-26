const firebase = {
  database: () => ({
    ref: () => ({
      update: () => Promise.resolve({}),
      once: () => Promise.resolve({
        val: () => ({})
      })
    })
  })
}

firebase.database.__proto__.ServerValue = { TIMESTAMP: 0 }

module.exports = firebase
