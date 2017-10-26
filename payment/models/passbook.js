const assert = require("assert")
const _ = require("lodash")

const TABLE = "passbook"

/**
 * passbook テーブルが無ければ作成する Promise を返す
 */
function initialize(db) {
  return db.schema.createTableIfNotExists(TABLE, table => {
    table.increments()
    table.string("user_id").notNullable()
    table.integer("point").notNullable()
    table.integer("balance").notNullable()
    table.timestamp("created_at").notNullable().defaultTo(db.fn.now())
    table.string("instance_id")
    table.string("build_id")
    table.string("charge_id").unique()
  })
}

/**
 * 指定された user_id を行ロックする Promise を返す
 * 読み書きをロックして待ちが発生する
 */
function transactionForUser(db, user_id, func) {
  assert(_.isString(user_id))

  if (db.__debug_transaction_disabled === true) {
    return func(db)
  }

  return db.transaction(t => {
    t(TABLE)
      .forUpdate()
      .select("*")
      .where({ user_id })

    return func(t)
  })
}

/**
 * passbook テーブルに行を追加する Promise を返す
 * 必須の列以外は params で渡す
 */
function insert(db, user_id, point, balance, params = {}) {
  assert(_.isString(user_id))
  assert(_.isNumber(point))
  assert(_.isNumber(balance))
  return db(TABLE).insert(Object.assign({}, params, {
    user_id, point, balance
  }))
}

/**
 * 指定された user_id の行を全て取得する Promise を返す
 */
function selectByUserId(db, user_id) {
  assert(_.isString(user_id))
  return db(TABLE).select("*").orderBy("id").where({ user_id })
}

/**
 * 最後の取引の残高を取得する Promise を返す
 * 取引が存在しない場合は 0 を返す
 */
function getLastBalance(db, user_id) {
  assert(_.isString(user_id))
  return db(TABLE)
    .first("*")
    .orderBy("id", "desc")
    .where({ user_id })
    .then(row => row ? row.balance : 0)
}

/**
 * 特定のビルドで消費されたポイントの合計を取得する Promise を返す
 * ビルドが存在しない場合はエラー
 */
function getTotalPointsForBuild(db, user_id, build_id, instance_id) {
  return db(TABLE)
    .sum("point")
    .where({ user_id, build_id, instance_id })
    .then(result => {
      if (result.length === 0) {
        throw new Error("getTotalPointsForBuild: 結果が不正")
      }
      const point = result[0][`sum("point")`]
      if (_.isNil(point)) {
        throw new Error("getTotalPointsForBuild: sum の結果が入っていない。ビルドが存在しないかカラム名が変更されている")
      }
      return point
    })
}

/**
 * ポイントを加算する Promise を返す
 * トランザクションの中で実行すること
 */
function addPoints(db, user_id, point, params) {
  return Promise.resolve()
    .then(() => getLastBalance(db, user_id))
    .then(lastBalance => {
      const balance = lastBalance + point
      if (balance < 0) {
        throw new Error(`残高 ${lastBalance} より多くのポイント ${point} を使おうとした`)
      }
      return insert(db, user_id, point, balance, params)
    })
}

/**
 * 課金によるポイント追加を行う Promise を返す
 */
function addPointsByCharge(db, user_id, point, charge_id) {
  assert(point >= 0, "ポイントは正の数")

  return transactionForUser(db, user_id, t =>
    addPoints(t, user_id, point, { charge_id })
  )
}

/**
 * ビルドによるポイント消費を行う Promise を返す
 */
function usePointsForBuild(db, user_id, point, build_id, instance_id) {
  assert(_.isNumber(point))
  assert(point >= 0, "ポイントは正の数")

  return transactionForUser(db, user_id, t =>
    addPoints(t, user_id, -point, { build_id, instance_id })
  )
}

/**
 * ビルドによるポイント消費を打ち消すポイント追加を行う Promise を返す
 * 取り消し済みの場合はエラー
 */
function restorePointsForBuild(db, user_id, build_id, instance_id) {
  return transactionForUser(db, user_id, t =>
    getTotalPointsForBuild(t, user_id, build_id, instance_id)
      .then(point => {
        if (point === 0) {
          throw new Error("取り消すべきポイント消費がありません")
        }
        return addPoints(t, user_id, -point, { build_id, instance_id })
      })
  )
}

module.exports = Passbook = {
  initialize,
  addPointsByCharge,
  usePointsForBuild,
  restorePointsForBuild
}
