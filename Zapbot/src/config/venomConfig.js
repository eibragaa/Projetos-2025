const puppeteer = require('puppeteer');

const options = {
    browserArgs: [
        '--disable-web-security',
        '--no-sandbox',
        '--disable-web-security',
        '--aggressive-cache-discard',
        '--disable-cache',
        '--disable-application-cache',
        '--disable-offline-load-stale-cache',
        '--disk-cache-size=0'
    ],
    puppeteerOptions: {
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ]
    },
    createPathFileToken: true,
    disableWelcome: true,
    updatesLog: true,
    autoClose: false,
    waitForLogin: true
};

module.exports = options;
