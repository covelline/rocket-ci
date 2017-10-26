const Passbook = require("../models/passbook")

function setupDatabase(db) {
  return Promise.all([
    Passbook.initialize(db)
  ])
}

module.exports = {
  setupDatabase
}
