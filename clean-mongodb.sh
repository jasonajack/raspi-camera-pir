#!/bin/bash -x
cd $(dirname ${0})

# Read in variables from config.json
readvar() { cat config.json | python -c "import sys, json; print json.load(sys.stdin)['${1}']"; }
mongourl=$(readvar 'mongourl')
expireTimeMillis=$(readvar 'expireTimeMillis')
expireSizeGB=$(readvar 'expireSizeGB')
expireSizeGB=$((expireSizeGB * 1024 * 1024))

# Cleanup database of old stuff
mongoCmd() { mongo --quiet ${mongourl} -eval "${@}"; }
dbSize=$(mongoCmd 'db.images.dataSize()')
if [[ ${dbSize} -gt ${expireSizeGB} ]]; then
  mongoCmd "db.images.remove({'_id': {\$lt: $oldest}})"
fi

