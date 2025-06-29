#!/usr/bin/env bash


for FILE in $(find x1000 -name *.jpg); do
echo '  {
    "image": "'${FILE}'",
    "title": "TBD",
    "link": ""
  },
'
done
