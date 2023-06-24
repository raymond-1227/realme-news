const { WebhookClient } = require('discord.js');
const al = require('@dumpy/andylib');
const l = new al.logger()
require('dotenv').config()
const config = require('./config.json')
const client = new WebhookClient({ id: process.env.ID, token: process.env.TOKEN });
// import puppeteer
const puppeteer = require('puppeteer');
// scrape https://www.gsmarena.com/news.php3
async function fetch() {
    // launch puppeteer
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(config.link);
    // get all the news titles
    const titles = await page.evaluate(() => {
        const news = document.querySelectorAll('.news-item');
        const titles = [];
        news.forEach((item) => {
            titles.push(item.querySelector('h3').innerText);
        })
        return titles
    });
    const links = await page.evaluate(() => {
        const news = document.querySelectorAll('.news-item');
        const links = [];
        news.forEach((item) => {
            links.push(item.querySelector('a').href);
        })
        return links
    })
    console.log(titles);
    console.log(links);
    return links;
}
let oldLinks = [];
l.info('Starting');
fetch().then((links) => {
    // check if there are any new links
    const newLinks = links.filter((link) => !oldLinks.includes(link));
    if (newLinks.length > 0) {
        l.debug('Sent new links');
    } else {
        l.error("No new links");
        return;
    }
    // set the old links to the new links
    oldLinks = links;
}).catch((err) => console.log(err));
let oldLinks = [];
 l.info('Starting');
    fetch().then((links) => {
        // check if there are any new links
        const newLinks = links.filter((link) => !oldLinks.includes(link));
        if (newLinks.length > 0) {
            // send the new links
            client.send(`${newLinks.join(' ')}`);
            l.debug('Sent new links');
        } else {
            l.error("No new links");
            return;
        }
        // set the old links to the new links
        oldLinks = links;
    }).catch((err) => console.log(err));

setInterval(() => {
    l.info('Starting');
    fetch().then((links) => {
        // check if there are any new links
        const newLinks = links.filter((link) => !oldLinks.includes(link));
        if (newLinks.length > 0) {
            // send the new links
            client.send(`${newLinks.join(' ')}`);
            l.debug('Sent new links');
        } else {
            l.error("No new links");
            return;
        }
        // set the old links to the new links
        oldLinks = links;
    }).catch((err) => console.log(err));
}, 900000)
