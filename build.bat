start npx tsc -w

start npx postcss ./src/window/css/index.css -d ./dist/window  --watch

cd ./extension

start npx tsc -w

start npx postcss ./src/css/index.css -d ./dist  --watch