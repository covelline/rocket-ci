const router = require("express").Router()
const promisify = require("es6-promisify")
const _ = require("lodash")
const logging = require("../lib/logging")
const stringify = require("json-stringify-safe")

module.exports = function(compute) {
  const deleteVirtualMachine = (zone, name) => {
    const vm = compute.zone(zone).vm(name)
    return promisify(vm.delete, vm)
  }

  const fetchTerminatedBuildMachines = () => {
    const options = { filter: "(name eq ^builder-.+$) (status eq TERMINATED)" }
    return promisify(compute.getVMs, compute, { multiArgs: true })(options)
  }

  router.get("/delete-all", (req, res) => {

    const logger = logging("delete_all_vm", {
      "type": "gae_app"
    })

    fetchTerminatedBuildMachines()
      .then(vms => {
        const tasks = _.map(vms, vm => {
          logger.info(`${vm.zone.id}/${vm.name} を削除します`)
          return promisify(vm.delete, vm)()
        })
        return Promise.all(tasks)
      })
      .then(() => {
        logger.info("削除しました")
        res.sendStatus(200)
      })
      .catch(error => {
        logger.error({
          "message": "削除中にエラーが発生しました",
          "payload": stringify(error, null, "  ")
        })
        res.sendStatus(500)
      })
  })

  router.delete("/:zone/:name", (req, res) => {

    const logger = logging("delete_vm", {
      "type": "gae_app"
    })
    const zone = req.params.zone
    const name = req.params.name

    if (!zone || !name) {
      logger.error({
        message: `不正なパラメータ => zone: ${zone}, vm: ${name}`
      })
      res.sendStatus(400)
      return
    }

    logger.info(`${zone}/${name} を削除します`)

    deleteVirtualMachine(zone, name)()
      .then(() => {
        logger.info(`${zone}/${name} を削除しました`)
        res.sendStatus(200)
      })
      .catch(e => {
        logger.error({
          "message": `${zone}/${name} の削除中にエラーが発生しました`,
          "payload": stringify(e, null, "  ")
        })
        res.sendStatus(500)
      })
  })

  return router
}
