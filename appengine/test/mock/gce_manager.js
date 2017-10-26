"use strict:";
/* eslint-disable no-console */
module.exports = function() {
  const findAvailableRegion = (callback) => {
    callback(null, {})
  }

  const launchBuildMachine = (repositoryID, pullRequestHtmlURL, buildNumber,region, machineName, callback) => {
    callback(null, {
      vm: {
        name: "launched"
      }
    })
  }

  return {
    findAvailableRegion,
    launchBuildMachine
  }
}
