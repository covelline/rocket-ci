#!/bin/bash -u

WORKDIR=$(cd $(dirname $0) && pwd)
cd $WORKDIR

echo "OK!"
echo ""

echo "現在稼働中のサービスを取得しています..."
VS=`gcloud --project=rocket-ci app versions list --hide-no-traffic`

echo ">>>"
echo "${VS}"
echo "<<<"
echo ""

VERSION=`node -p "require('./package').version"`
DEPLOY_VERSION=${VERSION//./-}

echo -n "${DEPLOY_VERSION} を deploy します. よろしいですか？ Enter で実行。 中断は Ctrl + C。"
read

gcloud --project=rocket-ci app deploy --version ${DEPLOY_VERSION} --no-promote

echo "ビルドに成功したらタグを push してください。 `git push covelline --tags`"

