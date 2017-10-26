// 指定した URL をファイルとしてダウンロードさせる
export default function download(url, name) {
  var a = document.createElement("a")
  a.href = url
  a.setAttribute("download", name || "noname")
  a.click()
}
