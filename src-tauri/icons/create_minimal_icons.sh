#!/bin/bash
# Create minimal valid PNG files

# 1x1 blue PNG (smallest valid PNG)
base64 -d << 'IMGEOF' > 32x32.png
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAEklEQVR42mNgGAWjYBSMAggAAAQQAAF/TXiOAAAAAElFTkSuQmCC
IMGEOF

cp 32x32.png 128x128.png
cp 32x32.png 128x128@2x.png  
cp 32x32.png icon.png
cp 32x32.png icon.icns
cp 32x32.png icon.ico

echo "Minimal icons created"
