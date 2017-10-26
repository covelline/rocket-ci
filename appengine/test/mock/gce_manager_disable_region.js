"use strict:";
/* eslint-disable no-console */
module.exports = function() {
  const findAvailableRegion = (callback) => {
    callback(null, null)
  }
  const launchBuildMachine = () => {
    throw new Error("should not call");
  }

  return {
    findAvailableRegion,
    launchBuildMachine
  }
}
