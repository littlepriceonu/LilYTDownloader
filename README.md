# 🎥 LilYTDownloader

LilYTDownloader is a windows app that lets you download youtube videos free of hassle on your own network, ignoring forced network limitations from websites.


## 🏃‍♂️ How do I use LYT?

### ! LilYTDownloader is still in beta !

* Download the latest release from the releases page
* Install a userscript extension on your browser, something like [`tampermonkey`](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
* Copy everything in the [`userscript.js`](https://github.com/littlepriceonu/LilYTDownloader/blob/main/userscript/LYT.user.js) and paste it into a new script than hit CTRL + S
* Have fun downloading!

## 🎥 Contributing

Contribuing is greatly appriciated!
Feel free to fork this repo and make a pull request, [I've](https://littlepriceonu.com) written a documentation and types for most of the important functions and important data in LYT.

### 📺 Setting up the Developer Enviroment

* Fork the repo and run `npm i` to install all the dependencies.
* Run `npm run build` to open 2 terminals which will compile the Typescript & Postcss within the project.
* Run `npm start` to test the project with electron forge.
* (Optional) Run `npx electron .` to test quickly without temporarly compiling the project.
 