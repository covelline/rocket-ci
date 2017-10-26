# trigger-build

github のイベントをトリガーにビルド用仮想マシンの起動を行うサーバーアプリケーションです。

google app engine での動作を想定しています。

## 認証ファイルの準備

`cred` ディレクトリに google cloud platform へのアクセスを行うための認証ファイルと、 firebase へのアクセスを行う認証ファイルを展開します。


```
cred
├── trigger-build.json
```

## ログについて

標準で Cloud Logging にログを送信し、コンソールには特に何も出力しません。

コンソールにログを出したい場合は環境変数 `DEBUG=rocket` を定義することで出力されます。

ログの出力には `debug` モジュールを使用しています。

Cloud Logging へのログの送信は環境変数 `DISABLE_CLOUD_LOGGING=""` を
定義することで停止できます。

## デプロイ

Docker のビルドに時間がかかるようなので、タイムアウト時間を伸ばします

    gcloud config set app/cloud_build_timeout 1800 #30分あれば余裕でしょ？

`npm` のスクリプトにデプロイが入っているので、実行します

    npm run deploy

## Visual Studio Code

VSCode でのデバッグ

1. appengine ディレクトリを VSCode に追加
1. サイドバーのデバッグタブを選択
1. mocha か node を選択 (テストコードのときは mocha を使う)
1. 緑の再生ボタンを押す

プログラムはブレークポイントか `debugger` を書いた行で止まり、変数やコールスタックを見ることができます。

デバッグの設定は appengine/.vscode/launch.json に記述されています。
