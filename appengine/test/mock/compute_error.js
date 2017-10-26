"use strict:";

/**
  使われないことを確かめる gcloud.compute のモック
*/
class Compute {
  getRegions() {
    throw new Error("getRegions() が呼ばれることはない")
  }
  zone() {
    throw new Error("zone() が呼ばれることはない")
  }
  getVMs() {
    throw new Error("getVMs() が呼ばれることはない")
  }
}

module.exports = new Compute()
