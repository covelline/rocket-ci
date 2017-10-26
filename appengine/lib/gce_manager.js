"use strict"

const async = require("async")

const getLast = (array) => {
  return array[array.length - 1]
}

module.exports = function(compute) {
  /*
   * gcp_config/vm_machine_type.json で定義された
   * VM を起動する余地のある Region を見つけて返します。
   * VM の起動が可能な Region があった場合はその Region オブジェクトを返します。
   * https://cloud.google.com/compute/docs/reference/latest/regions
   * 見つからない場合は null を返します
   */
  const findAvailableRegion = (callback) => {
    const machineType = require("../config/vm_machine_type.json")
    const config = require("../config/vm_config.json")
    /* eslint-disable no-unused-vars */
    compute.getRegions(null, (err, regions, nextQuery, apiResponse) => {
      if (err) {
        callback(err)
        return
      }
      const region = regions.find((reg) => {
        const cpu = reg.metadata.quotas.find(q => q.metric == "CPUS")
        const hdd = reg.metadata.quotas.find(q => q.metric == "DISKS_TOTAL_GB")
        return cpu.usage + machineType.guestCpus < cpu.limit && hdd.usage + Number(config.disks[0].initializeParams.diskSizeGb) < hdd.limit
      })
      if (!region) {
        callback(null, null)
      } else {
        callback(null, region)
      }
    })
    /* eslint-enable no-unused-vars */
  }

  /**
   * config/vm_machine_type.json で定義された VM を
   * パラメータに渡された region に対して起動し、 event をビルドします。
   * 起動に成功するとレスポンスオブジェクトとして vm, operation, apiResponse を返します。
   * @param repository_id ビルド対象のリポジトリの IDです
   * @param pull_request_html_url Pull Request イベントによるビルドのときは、 html_url を渡します
   * @param build_number firebase のビルド番号
   */
  const launchBuildMachine = (repository_id, pull_request_html_url, build_number, region, name, callback) => {
    const zoneName = getLast(region.metadata.zones[0].split("/"))
    const zone = compute.zone(zoneName)
    const config = require("../config/vm_config.json")
    const machineType = require("../config/vm_machine_type.json")
    config.name = name
    config.metadata = {
      "items": [{
        "key": "startup-script",
        "value": `ROCKET_HOOK_URL=https://hooks.rocket-ci.com ROCKET_HOOK_SIGNATURE=${process.env.GITHUB_SIGNATURE} /usr/local/scripts/startup.rb`
      }, {
        "key": "shutdown-script",
        "value": `ROCKET_HOOK_URL=https://hooks.rocket-ci.com ROCKET_HOOK_SIGNATURE=${process.env.GITHUB_SIGNATURE} /usr/local/scripts/shutdown.rb`
      }, {
        "key": "repository_id",
        "value": repository_id
      }, {
        "key": "pull_request_html_url",
        "value": pull_request_html_url
      }, {
        "key": "build_number",
        "value": build_number
      }, {
        "key": "cache_bucket",
        "value": "rocket-ci.appspot.com"
      }, {
        "key": "traffic_limit_mb",
        "value": 500
      }
      ]
    }
    config.machineType = machineType.name
    config.disks[0].initializeParams.diskName = name
    /* eslint-disable no-unused-vars */
    async.waterfall([
      (callback) => {
        zone.createVM(name, config, callback)
      },
      (vm, operation, apiResponse, callback) => {
        vm.start((err, operation, apiResponse) => {
          if (err) {
            callback(err)
          } else {
            callback(null, { vm, operation, apiResponse })
          }
        })
      }
    ], callback)
    /* eslint-enable no-unused-vars */
  }

  return {
    compute,
    findAvailableRegion,
    launchBuildMachine
  }
}
