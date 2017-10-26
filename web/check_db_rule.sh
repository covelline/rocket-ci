DB_SECRET="<YOUR DB SECRET>"
DB_URL="https://rocket-ci.firebaseio.com"

TEMP_FILE=`mktemp`

curl --silent --show-error "${DB_URL}/.settings/rules.json?auth=${DB_SECRET}" > ${TEMP_FILE}

git --no-pager diff --no-index ${TEMP_FILE} ./database.rules.json

rm ${TEMP_FILE}

