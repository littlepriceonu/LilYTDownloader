cd ./extension

start npx tsc -w

start npx postcss ./src/css/index.css -d ./dist  --watch

exit