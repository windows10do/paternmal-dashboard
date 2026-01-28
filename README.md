# PaternMal Dashboard
__Powered by [PaternMal](https://github.com/windows10do/PaternMal)__, the site is already live [here](https://windows10do.github.io/paternmal-dashboard). Get ready to test your proxy.
### Sample
Proxy file is [here](plugin/node/paternmal.js) and packages is [here](plugin/node/packages.json). Run using:
```bash
sudo apt update -y
sudo apt install nodejs npm git -y
git clone https://github.com/windows10do/paternmal-dashboard.git/
cd paternmal-dashboard/plugin/node/
npm install
node paternmal.js --port 8080
```
and finally ping in your dashboard.

> [!IMPORTANT]
> PaternMal Dashboard is not for hackers.
> 
> For beginner purposes, check [here](https://github.com/windows10do/PaternMal) first.

> [!NOTE]
> PaternMal Dashboard requires the same [`paternmal.js`](plugin/node/paternmal.js) and [`packages.json`](plugin/node/packages.json).

> [!TIP]
> Now you can test performance, but mostly fails.
