import { EmbedBuilder, WebhookClient } from "discord.js";
import { config } from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

config();

const client = new WebhookClient({
  url: process.env.WEBHOOK_URL,
});

const getPreviewImage = async (url) => {
  const resp = await axios.get(url);
  const text = await resp.text();
  const htmldoc = new DOMParser().parseFromString(text, 'text/html');
  const metaTags = htmldoc.getElementsByTagName('meta');
  for (let i = 0; i < metaTags.length; i++) {
      // example meta tag from GSMArena:
      // <meta property="og:image" content="https://fdn.gsmarena.com/imgroot/news/24/02/weekly-poll-results-realme-12-pro-12-pro-plus/-952x498w6/gsmarena_000.jpg">
      if (metaTags[i].getAttribute('property') === 'og:image') {
          return metaTags[i].getAttribute('content');
      }
  }
  return null;
}

const fetch = async () => {
  const url = "https://www.gsmarena.com/";
  const html = await axios.get(
    "https://www.gsmarena.com/news.php3?sSearch=realme"
  );
  const $ = cheerio.load(html.data);
  const news = $(".news-item");
  const data = [];
  news.each((i, el) => {
    const title = $(el).find("h3").text();
    const link = $(el).find("a").attr("href");
    data.push({
      title: title,
      link: url + link,
    });
  });
  return data;
};

let oldLinks = []; // Store old links instead of entire objects
const check = async () => {
  fetch()
    .then((data) => {
      const newLinks = data.map((d) => d.link);
      const uniqueLinks = newLinks.filter((link) => !oldLinks.includes(link));
      oldLinks = newLinks;
      const newData = data.filter((d) => uniqueLinks.includes(d.link));
      newData.forEach((d) => {
        const previewImage = getPreviewImage(d.link);
        const embed = new EmbedBuilder()
          .setTitle(d.title)
          .setURL(d.link)
          .setTimestamp()
          .setColor("#FF0000")
          .setImage(previewImage)
          .setFooter({
            text: "Realme News",
          });
        client.send({
          embeds: [embed],
        });
        console.log("Sent " + d.title);
      });
    })
    .catch((err) => console.log(err));
};

setInterval(check, 1000 * 60 * 10);
