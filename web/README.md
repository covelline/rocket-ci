# フロント側

## 開発を始める

`npm start`

src/ 内のファイルの更新が監視され localhost:8080 がライブリロードされる

## ローカルで動かす

```bash
npm run build
pushstate-server build
```

firebase の設定を確かめるときなど

## デプロイ

```bash
rm -rf build # 古い成果物は念のため消しておく
npm run build # 成果物は build に入る
npm run deploy # デプロイする
```

## 環境変数 (REACT_APP__*)

js をコンパイルするときに環境変数を使うことができる.

> https://github.com/facebookincubator/create-react-app/blob/master/packages/react-scripts/template/README.md#adding-custom-environment-variables

ex) `REACT_APP_ROCKET_API_URL="http://localhost:8080" npm start`

### REACT_APP_ROCKET_API_URL

この環境変数を使って Rocket API の URL を上書きすることができる.

デフォルトでは "https://hooks.rocket-ci.com" が使用される.

フロントから API を叩くときにローカルのサーバーにリクエストしたいときに使える.

## CORS

Cross-Origin Resource Sharing (CORS) の問題で `rocket-ci.appspot.com` 以外からビルド成果物にアクセスするためには CORS の設定を行う必要がある。

CORS の設定は `storage.cors.json` ファイルで管理しているので変更する場合はこのファイルを編集して以下のコマンドでデプロイする。

`gsutil cors set storage.cors.json gs://rocket-ci.appspot.com`

現在の設定は以下のコマンドで取得できる。

`gsutil cors get gs://rocket-ci.appspot.com`


詳細は以下の URL を参考されたし。

https://cloud.google.com/storage/docs/cross-origin

## favicon の生成

```bash
npm run favicon
```

public/ 以下に画像ファイルが保存されます。
