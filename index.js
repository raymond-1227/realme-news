import { EmbedBuilder, WebhookClient } from "discord.js";
import { config } from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

config();

const client = new WebhookClient({
  url: process.env.DISCORD_WEBHOOK_URL,
});

const getPreviewImage = async (url) => {
  const resp = await axios.get(url);
  const text = resp.data;
  // Use Cheerio to parse the HTML
  const $ = cheerio.load(text);
  const metaTags = $("meta");
  for (let i = 0; i < metaTags.length; i++) {
    const tag = metaTags[i];
    if (tag.attribs.property === "og:image") {
      return tag.attribs.content;
    }
  }
  return;
};

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
    const link = url + $(el).find("a").attr("href");
    data.push({ title, link });
  });
  return data;
};

let oldLinks = []; 
const check = async () => {
  console.log("Checking for new news...");
  fetch()
    .then((data) => {
      console.log(data)
      const newLinks = data.map((d) => d.link);
      const uniqueLinks = newLinks.filter((link) => !oldLinks.includes(link));
      oldLinks = newLinks;
      const newData = data.filter((d) => uniqueLinks.includes(d.link));
      newData.forEach((d) => {
       getPreviewImage(d.link).then((image) => {
          const embed = new EmbedBuilder()
          .setTitle(d.title)
          .setURL(d.link)
          .setTimestamp()
          .setColor("#FF0000")
          .setImage(image)
          .setFooter({
            text: "Realme News",
          });
        client.send({
          embeds: [embed],
        });
        console.log("Sent " + d.title);
        });
      });
    })
    .catch((err) => console.log(err));
};
setInterval(check, 1000 * 60 * 10);
