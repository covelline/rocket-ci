const assert = require("assert")
const { initialize, addPointsByCharge, usePointsForBuild, restorePointsForBuild} = require("../../models/passbook")

function createDatabaseInMemory() {
  return require("knex")({
    dialect: "sqlite3",
    connection: {
      filename: ":memory:"
    },
    useNullAsDefault: true
  })
}

describe("passbook", () => {

  describe("initialize", () => {
    it("テーブルが作成される", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => db("passbook").select("*")) // table がないときはエラー
        .then(rows => {
          assert(rows instanceof Array)
          done()
        })
        .catch(e => {
          assert(false, e)
          done()
        })
    })
  })

  describe("トランザクション", () => {
    it("成功", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => {
          return Promise.all([
            addPointsByCharge(db, "USER ID", 20, "CHARGE ID1"),
            usePointsForBuild(db, "USER ID", 3, "BUILD ID", "INSTANCE ID"),
            addPointsByCharge(db, "USER ID", 1, "CHARGE ID2"),
            usePointsForBuild(db, "USER ID", 3, "BUILD ID", "INSTANCE ID"),
            addPointsByCharge(db, "USER ID", 1, "CHARGE ID3"),
            usePointsForBuild(db, "USER ID", 3, "BUILD ID", "INSTANCE ID"),
            addPointsByCharge(db, "USER ID", 1, "CHARGE ID4"),
          ])
        })
        .then(() => db("passbook").select("*"))
        .then(rows => {
          assert.equal(rows[0].balance, 20)
          assert.equal(rows[1].balance, 17)
          assert.equal(rows[2].balance, 18)
          assert.equal(rows[3].balance, 15)
          assert.equal(rows[4].balance, 16)
          assert.equal(rows[5].balance, 13)
          assert.equal(rows[6].balance, 14)
          done()
        })
        .catch(e => {
          assert(false, e)
          done()
        })
    })

    it("失敗", done => {
      const db = createDatabaseInMemory()
      db.__debug_transaction_disabled = true
      initialize(db)
        .then(() => {
          return Promise.all([
            addPointsByCharge(db, "USER ID", 20, "CHARGE ID1"),
            usePointsForBuild(db, "USER ID", 3, "BUILD ID", "INSTANCE ID"),
            addPointsByCharge(db, "USER ID", 1, "CHARGE ID2"),
            usePointsForBuild(db, "USER ID", 3, "BUILD ID", "INSTANCE ID"),
            addPointsByCharge(db, "USER ID", 1, "CHARGE ID3"),
            usePointsForBuild(db, "USER ID", 3, "BUILD ID", "INSTANCE ID"),
            addPointsByCharge(db, "USER ID", 1, "CHARGE ID4"),
          ])
        })
        .then(() => db("passbook").select("*"))
        .then(rows => {
          assert.equal(rows[0].balance, 20)
          assert.equal(rows[1].balance, 17)
          assert.equal(rows[2].balance, 18)
          assert.equal(rows[3].balance, 15)
          assert.equal(rows[4].balance, 16)
          assert.equal(rows[5].balance, 13)
          assert.equal(rows[6].balance, 14)
          done()
        })
        .then(() => {
          assert(false, "ここには来ない")
        })
        .catch(e => {
          assert.notEqual(e.message, "ここには来ない")
          done()
        })
    })
  })

  describe("addPointsByCharge", () => {

    it("ポイントの加算ができる", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => addPointsByCharge(db, "USER ID", 10, "CHARGE ID"))
        .then(() => db("passbook").select("*"))
        .then(rows => {
          assert.equal(rows.length, 1)
          const row = rows[0]
          assert.equal(row.user_id, "USER ID")
          assert.equal(row.point, 10)
          assert.equal(row.charge_id, "CHARGE ID")
          assert.equal(row.balance, 10)
          done()
        })
        .catch(e => {
          assert(false, e)
          done()
        })
    })

    it("charge_id が重複しているときはエラー", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => addPointsByCharge(db, "USER ID", 1, "CHARGE ID"))
        .then(() => addPointsByCharge(db, "USER ID", 1, "CHARGE ID"))
        .then(() => {
          assert(false, "ここには来ない")
        })
        .catch(e => {
          assert.equal(e.code, "SQLITE_CONSTRAINT")
          done()
        })
    })

    it("ポイントが user_id ごとに加算される", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => addPointsByCharge(db, "USER ID", 1, "CHARGE ID"))
        .then(() => addPointsByCharge(db, "USER ID 2", 2, "CHARGE ID 2"))
        .then(() => addPointsByCharge(db, "USER ID", 7, "CHARGE ID 3"))
        .then(() => db("passbook").select("*"))
        .then(rows => {
          assert.equal(rows.length, 3)
          assert.equal(rows[0].balance, 1)
          assert.equal(rows[1].balance, 2)
          assert.equal(rows[2].balance, 8, "user_id ごとに加算される")
          done()
        })
        .catch(e => {
          assert(false, e)
          done()
        })
    })
  })

  describe("usePointsForBuild", () => {

    it("ポイントが引かれる", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => addPointsByCharge(db, "USER ID", 10, "CHARGE ID"))
        .then(() => usePointsForBuild(db, "USER ID", 10, "BUILD ID", "INSTANCE ID"))
        .then(() => db("passbook").select("*"))
        .then(rows => {
          assert.equal(rows.length, 2)
          const row = rows[1]
          assert.equal(row.user_id, "USER ID")
          assert.equal(row.point, -10)
          assert.equal(row.build_id, "BUILD ID")
          assert.equal(row.instance_id, "INSTANCE ID")
          assert.equal(row.balance, 0)
          done()
        })
        .catch(e => {
          assert(false, e)
          done()
        })
    })

    it("ポイントが足りないときはエラー", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => usePointsForBuild(db, "USER ID", 10, "BUILD ID", "INSTANCE ID"))
        .then(() => {
          assert(false, "ここには来ない")
        })
        .catch(e => {
          assert.notEqual(e.message, "ここには来ない")
          done()
        })
    })

    it("ポイントが user_id ごとに引かれる", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => addPointsByCharge(db, "USER ID", 10, "CHARGE ID"))
        .then(() => addPointsByCharge(db, "USER ID 2", 2, "CHARGE ID 2"))
        .then(() => usePointsForBuild(db, "USER ID", 2, "BUILD ID", "INSTANCE ID"))
        .then(() => db("passbook").select("*"))
        .then(rows => {
          assert.equal(rows.length, 3)
          assert.equal(rows[0].balance, 10)
          assert.equal(rows[1].balance, 2)
          assert.equal(rows[2].balance, 8, "user_id ごとに引かれる")
          done()
        })
        .catch(e => {
          assert(false, e)
          done()
        })
    })
  })

  describe("restorePointsForBuild", () => {

    it("ポイント消費の取り消しができる", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => addPointsByCharge(db, "USER ID", 10, "CHARGE ID"))
        .then(() => usePointsForBuild(db, "USER ID", 2, "BUILD ID", "INSTANCE ID"))
        .then(() => usePointsForBuild(db, "USER ID", 3, "BUILD ID", "INSTANCE ID"))
        .then(() => restorePointsForBuild(db, "USER ID", "BUILD ID", "INSTANCE ID"))
        .then(() => db("passbook").select("*"))
        .then(rows => {
          assert.equal(rows.length, 4)
          const row = rows[3]
          assert.equal(row.user_id, "USER ID")
          assert.equal(row.build_id, "BUILD ID")
          assert.equal(row.instance_id, "INSTANCE ID")
          assert.equal(row.point, 5, "ポイント消費の合計のポイント数になっている")
          assert.equal(row.balance, 10, "消費前の残高になっている")
          done()
        })
        .catch(e => {
          assert(false, e)
          done()
        })
    })

    it("build_id, instance_id ごとに取り消される", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => addPointsByCharge(db, "USER ID", 10, "CHARGE ID"))
        .then(() => usePointsForBuild(db, "USER ID", 2, "BUILD ID", "INSTANCE ID"))
        .then(() => usePointsForBuild(db, "USER ID", 3, "BUILD ID 2", "INSTANCE ID"))
        .then(() => usePointsForBuild(db, "USER ID", 3, "BUILD ID", "INSTANCE ID 3"))
        .then(() => restorePointsForBuild(db, "USER ID", "BUILD ID", "INSTANCE ID"))
        .then(() => db("passbook").select("*"))
        .then(rows => {
          assert.equal(rows.length, 5)
          const row = rows[4]
          assert.equal(row.user_id, "USER ID")
          assert.equal(row.build_id, "BUILD ID")
          assert.equal(row.instance_id, "INSTANCE ID")
          assert.equal(row.point, 2, "ポイント消費の合計のポイント数になっている")
          assert.equal(row.balance, 4, "残高が正しい")
          done()
        })
        .catch(e => {
          assert(false, e)
          done()
        })
    })

    it("ビルドが無ければエラー", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => restorePointsForBuild(db, "USER ID", "BUILD ID", "INSTANCE ID"))
        .then(() => {
          assert(false, "ここには来ない")
        })
        .catch(e => {
          assert.notEqual(e.message, "ここには来ない")
          done()
        })
    })

    it("取り消し済みならエラー", done => {
      const db = createDatabaseInMemory()
      initialize(db)
        .then(() => addPointsByCharge(db, "USER ID", 10, "CHARGE ID"))
        .then(() => usePointsForBuild(db, "USER ID", 2, "BUILD ID", "INSTANCE ID"))
        .then(() => restorePointsForBuild(db, "USER ID", "BUILD ID", "INSTANCE ID"))
        .then(() => restorePointsForBuild(db, "USER ID", "BUILD ID", "INSTANCE ID"))
        .then(() => {
          assert(false, "ここには来ない")
        })
        .catch(e => {
          assert.notEqual(e.message, "ここには来ない")
          done()
        })
    })
  })
})
