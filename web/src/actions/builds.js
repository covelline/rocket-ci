import firebase from "firebase"
import "whatwg-fetch"

// 指定したリポジトリのビルド情報を取得する
export const fetchBuilds = repoId => {
  return firebase.database().ref("artifacts").child(repoId).once("value")
    .then(snap =>
      snap.val() || [] // ビルド結果が無いときは空の配列を返す
    )
}

// 選択中のリポジトリの指定した id のビルド情報を取得する
export const fetchBuild = (repoId, buildId) => {
  return firebase.database().ref("artifacts")
    .child(repoId)
    .child(buildId).once("value")
    .then(snap => snap.val())
}

/**
  成果物の log.txt を取得する
  gsUrl: build.gs_url
  */
export const fetchBuildLog = gsUrl => {
  const logfileURL = `${gsUrl}/log.txt`
  return firebase.storage()
    .refFromURL(logfileURL)
    .getDownloadURL()
    .then(url => fetch(url))
    .then(res => res.text())
}
