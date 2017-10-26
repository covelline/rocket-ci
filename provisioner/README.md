# Virtual Machine

Android アプリビルド用仮想マシンイメージを作るためのファイルです。

## 依存ツール

 - [packer](https://www.packer.io/)
 - [ansible](https://www.ansible.com/)
 
## 使い方

`cred`ディレクトリを作り、 Dropbox の `Projects/rocket-ci/virtualmachine/cred` の中身をコピーします。


```
.
├── README.md
├── cred
│   ├── key_for_virtual_machine_provisioner
│   ├── key_for_virtual_machine_provisioner.pub
│   └── rocket-ci-b0c5330578c0.json
├── files
│   ├── android_accept.sh
│   └── install_sdk
├── install_ansible.sh
├── local.retry
├── local.yaml
└── vm.json

```

`packer build vm.json` を実行することで、仮想マシンイメージの作成が始まります。

## 設定

### インストールされる Android SDK

`files/install_sdk` にはインストールされる Android SDK のライブラリやツール群が定義されています。このファイルは

    android list sdk --all -e | grep id: | cut -f4 -d ' ' | sed -e 's/\"//g'

↑のコマンドで取得可能な物の中からソースコードやドキュメントと言った物を取り除いた物です。

### インストールされる Android NDK

`local.yaml` で定義されている `Install Android NDK` で利用している URL からダウンロードされる物です。

### 仮想マシンイメージの名前

`android-builder-sdk{ SDKのバージョン }-ndk{ NDKのバージョン }-{ タイムスタンプ }`

## 管理

仮想マシンイメージは android sdk/ndk や jdk などのアップデートが行われたときに、担当の人を決めて作成をします。

古い仮想マシンイメージは、過去1バージョンを残して削除します。 