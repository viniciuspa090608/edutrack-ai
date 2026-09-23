#!/bin/sh
set -eu

case "$TEST_DB_NAME" in
  ''|*[!a-zA-Z0-9_]*)
    echo 'Invalid TEST_DB_NAME' >&2
    exit 1
    ;;
esac

mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$TEST_DB_NAME\`"
