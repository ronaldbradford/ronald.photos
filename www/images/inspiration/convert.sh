#!/bin/bash
SIZE="1000"
for FILE in orig/*.jpg; do
    echo "Processing ${FILE}..."
    width=$(identify -ping -format "%w" "${FILE}")
    height=$(identify -ping -format "%h" "${FILE}")
    
    NEW_FILE="x${SIZE}/$(basename ${FILE})"
    if [ $width -gt $height ]; then
        # Landscape: limit width to ${SIZE}
        magick "${FILE}" -resize ${SIZE}x -strip "${NEW_FILE}"
    else
        # Portrait: limit height to ${SIZE}  
        magick "${FILE}" -resize x${SIZE} -strip "${NEW_FILE}"
    fi
    exiftool -Copyright="Copyright: Ronald Bradford" -overwrite_original "${NEW_FILE}"

done
