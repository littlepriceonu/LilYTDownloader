# 🎥 LilYTDownloader

LilYTDownloader (or LYT for short) is a Windows app that lets you download youtube videos free of hassle on your own network, ignoring forced network limitations from websites.


## 🏃‍♂️ How do I use LYT?

### ! LilYTDownloader is still in beta !

#### LYT runs in the background when you close the window, to fully close LYT open the Windows tray and right click on the LYT icon then hit `quit`

#### LYT doesn't support Brave, this is due to brave blocking localhost websocket connections   

* Download the latest release from the releases page.
* Run the setup (Windows may stop you from running, this is because the LYT installer is unsigned, to sign LYT would cost 459$ a year. To continue, hit "More info" then "Run anyway").
* If LYT doesn't open after the installation, open your Windows start menu and search for "LilYTDownloader".
* Install a userscript extension on your browser, something like [`tampermonkey`](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).
* Install [`the userscript`](https://github.com/littlepriceonu/LilYTDownloader/raw/main/userscript/LYT.user.js).
* Open a youtube video tab, right next to the subscribe button will be a *save* button, click this to open the LYT userscript GUI (this GUI is in *very* early stages of development, so it may not look the best).

## 🎥 Contributing

Contribuing is greatly appriciated!
Feel free to fork this repo and make a pull request, [I've](https://littlepriceonu.com) written a documentation and types for most of the important functions and important data in LYT.

### 📺 Setting up the Developer Enviroment

* Fork the repo and run `npm i` to install all the dependencies.
* Run `npm run build` to open 2 terminals which will compile the Typescript & Postcss within the project.
* Run `npm start` to test the project with electron forge.
* (Optional) Run `npx electron .` to test quickly without temporarly compiling the project.
 