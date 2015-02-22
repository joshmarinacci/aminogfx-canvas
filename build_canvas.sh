#!/bin/sh
rm -rf build/bundle.js
mkdir build

#node compile.js src/constraint-parser.ometajs  > parser_compiled.js
#    -r ./parser_compiled.js:parser \

browserify \
    -d \
    --verbose \
    -r ./main.js:aminogfx \
    -o build/bundle.js
echo "built!"
