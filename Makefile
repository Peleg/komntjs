# Builds dist/komnt.js and dist/komnt.css
all:
	npm install
	./node_modules/webpack/bin/webpack.js
