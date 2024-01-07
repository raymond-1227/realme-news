import { EmbedBuilder, WebhookClient } from "discord.js";
import { config } from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

config();

const client = new WebhookClient({
  url: process.env.WEBHOOK_URL,
});

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

let oldData = [];
const check = async () => {
  fetch()
    .then((data) => {
      const newData = data.filter((d) => !oldData.includes(d));
      oldData = data;
      newData.forEach((d) => {
        const embed = new EmbedBuilder()
          .setTitle(d.title)
          .setURL(d.link)
          .setTimestamp()
          .setColor("#FF0000")
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