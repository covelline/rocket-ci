# launcher

ローカルで起動している appengine のサーバーに対して webhook のリクエストを出すくんです.

デプロイせずに appengine のサーバーをテストするときに使用します.

VM は実施に起動するので VM のイメージを変更した後のテストなどにも使用できます.

リクエストの内容は json で記述できます(dataset ディレクトリを参照してください).

## 使い方

以下の手順で使用します.

1. ローカルでサーバーを起動
2. 1 で起動したサーバーに launcher を使ってリクエストを出す

### ローカルでサーバーを起動

任意の `GITHUB_SIGNATURE` を設定してサーバーを起動します.

ex) `GITHUB_SIGNATURE="ABCD" npm start`

debug ログあり ex) `GITHUB_SIGNATURE="ABCD" DEBUG=* npm start`

サーバーのログ出力に関することは appengine の README.md を参照してください.

> `GITHUB_SIGNATURE` は認証 token 的なものです.
> https://developer.github.com/webhooks/securing/

## リクエストを出す

任意の `GITHUB_SIGNATURE` を設定してサーバーにリクエストを出します.

リクエストを出す際にオプションとしてリクエストの内容が書かれた json ファイルへのパスを指定します.

ex) `GITHUB_SIGNATURE=ABCD node launcher.js ./dataset/success_test.json`

