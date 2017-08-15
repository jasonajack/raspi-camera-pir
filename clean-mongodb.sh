#!/bin/bash
cd $(dirname ${0})

# Read in variables from config.json
readvar() { cat src/config.json | python -c "import sys, json; print json.load(sys.stdin)['${1}']"; }
mongourl=$(readvar 'mongourl')
expireTimeSeconds=$(readvar 'expireTimeSeconds')
expireSizeMB=$(readvar 'expireSizeMB')
expireSizeMB=$((expireSizeMB * 1024 * 1024))

# Cleanup database of old stuff
mongoCmd() { mongo --quiet ${mongourl} -eval "${@}"; }
dbSize=$(mongoCmd 'db.images.dataSize()')
echo "Current database size: ${dbSize} bytes."
if [[ ${dbSize} -gt ${expireSizeMB} ]]; then
  # Calculate oldest timestamp in millis
  oldest=$(date +%s)
  oldest=$(((oldest - expireTimeSeconds) * 1000))
  echo "Database too big, culling data older than ${oldest}."

  # Cull oldest entries
  mongoCmd "db.images.remove({'_id': {\$lt: $oldest}})"
fi

