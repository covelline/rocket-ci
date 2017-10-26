#!/bin/bash -e

PROJECT_NAME="rocket-ci"

if [ -z ${RUN+x} ]; then
    echo "これは dry run ヾ(･∀･)ﾉダー"
    echo "RUN=1 ./gce-destroyer.sh で本当に削除されます"
fi

echo "Fetching the instance list..."

IFS=$'\n'
INSTANCE_LIST=`(gcloud --project "${PROJECT_NAME}" compute instances list \
    --regexp "^builder-.+$" \
    --format="csv(name,zone,status)" \
    --filter="status=TERMINATED" \
    | grep "TERMINATED")`

for item in ${INSTANCE_LIST[@]}; do

    NAME=`echo $item | cut -d"," -f1`
    ZONE=`echo $item | cut -d"," -f2`
    STATUS=`echo $item | cut -d"," -f3`
    COMMAND="gcloud --project ${PROJECT_NAME} --quiet compute instances delete ${NAME} --zone ${ZONE}"
    echo "`date`, status: ${STATUS}, execute: $COMMAND"

    # RUN が定義されてる時だけ実行する
    if [ ! -z ${RUN+x} ]; then
        eval ${COMMAND}
    fi
done

