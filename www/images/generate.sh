#!/usr/bin/env bash


for FILE in $(ls *.jpg); do
echo '  {
    "image": "'${FILE}'",
    "title": "TBD",
    "link": ""
  },
'
done
