# 🎥 LilYTDownloader

LilYTDownloader (or LYT for short) is a Windows app that lets you download youtube videos free of hassle on your own network, ignoring forced network limitations from websites.


## 🏃‍♂️ How do I use LYT?

### ! LilYTDownloader was designed to be used on a x64 windows machine !
#### More support may come in the future

### ! LilYTDownloader is still in beta !

#### LYT runs in the background when you close the window, to fully close LYT open the Windows tray and right click on the LYT icon then hit `quit`. A setting to disable this will be added in the future.

* Download the latest release from the releases page.

* Run the setup (Windows may stop you from running, this is because the LYT installer is unsigned, to sign LYT would cost 459$ a year. To continue, hit "More info" then "Run anyway").

* Wait for LYT to download, if a prompt asking for which networks to allow LYT to access, make sure to ALWAYS select "private networks such as my home network", this is so LYT can open a WebSocket on your local machine, which is the backbone of how LYT works.

* If LYT doesn't open after the installation, open your Windows start menu and search for "LilYTDownloader".

* Install the `extenstion.crx` from the releases page and run (double click) it, this will prompt you on which browser you'd like to open it in.

* Select your browser of choice.

* Pin the extension (or don't 😔) and click on the extension.

* You're all set!

#### Using the userscript (old)

* Install a userscript extension on your browser, something like [`tampermonkey`](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).

* Install [`the userscript`](https://github.com/littlepriceonu/LilYTDownloader/raw/main/userscript/LYT.user.js).

* Open a youtube video tab, right next to the subscribe button will be a *save* button, click this to open the LYT userscript GUI (this GUI is no longer in development, so it may not look the best).

## 🎥 Contributing

Contribuing is greatly appriciated!
Feel free to fork this repo and make a pull request, [I've](https://littlepriceonu.com) written a documentation and types for most of the important functions and important data in LYT.

### 📺 Setting up the Developer Enviroment

* Fork the repo and run `npm i` to install all the dependencies.

* Run `npm run build` to open 4 terminals which will compile the all Typescript & 
Postcss within the project.

* Run `npm start` to test the project with electron forge.

* (Optional) Run `npx electron .` to test quickly without temporarly compiling 
the project.
 
* (Optional) Run `npm run build:app` to just build the app & `npm run build:extension` to just build the extension