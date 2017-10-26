# umbilical

rocket と firebase を接続するから umbilical。

主に firebase database を操作する方法を提供する。

## インストール

`npm install -g` で出来るような段階ではないので zip でまとめるなりしてコピーして使用する。

## 認証情報

認証情報は自分で作るか Dropbox の中にあるこれを使う.

`/Dropbox/covelline, LLC/Projects/rocket-ci/umbilical/umbilical-cred.json`

## 使い方

全体的に認証情報ファイルへのパスの指定(`--key_file_path`)を忘れないこと.

`./umbilical --help`

```

  Usage: umbilical [options] [command]


  Commands:

    token [options]          Github の access token を取得する.
      access token が見つからない場合は何も出力せずに終了する(exit-status != 0).

    build-number [options]   ビルド番号の取得・インクリメントを行う.

      # 最新のビルド番号を取得
      umbilical build-number --repo_id 1234

      # ビルド番号をインクリメント(アトミックに行われる)
      umbilical build-number --repo_id 1234 --increment

    artifacts [options]      成果物情報を更新するコマンド.
        data に任意の json を渡して好きなように操作できる.

       # 情報を見る
       umbilical artifacts --repo_id 1234 --build_number 11 --show

       # 更新する
       umbilical artifacts --repo_id 1234 --build_number 11 --data '{"key": "value"}'


  Options:

    -h, --help     output usage information
    -V, --version  output the version number

```
