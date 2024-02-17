import { EmbedBuilder, WebhookClient } from "discord.js";
import { config } from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

config();

interface NewsItem {
  title: string;
  link: string;
}

const client = new WebhookClient({
  url: process.env.DISCORD_WEBHOOK_URL as string,
});

async function getPreviewImage(url: string): Promise<string | undefined> {
  const resp = await axios.get(url);
  const text = resp.data;
  const $ = cheerio.load(text);

  const metaTags = $("meta");
  for (let i = 0; i < metaTags.length; i++) {
    const tag = metaTags[i];
    if (tag.attribs.property === "og:image") {
      return tag.attribs.content;
    }
  }

  return undefined;
}

async function fetchNews(): Promise<NewsItem[]> {
  const url = "https://www.gsmarena.com/";
  const html = await axios.get(
    "https://www.gsmarena.com/news.php3?sSearch=realme",
  );
  const $ = cheerio.load(html.data);
  const newsItems = $(".news-item");
  const data: NewsItem[] = [];

  newsItems.each((i, el) => {
    const title = $(el).find("h3").text();
    const link = url + $(el).find("a").attr("href");
    data.push({ title, link });
  });

  return data;
}

let oldLinks: string[] = [];

async function checkForNewNews() {
  try {
    const newsData = await fetchNews();
    console.log(newsData);

    const newLinks = newsData.map((d) => d.link);
    const uniqueLinks = newLinks.filter((link) => !oldLinks.includes(link));
    oldLinks = newLinks;

    const newNews = newsData.filter((d) => uniqueLinks.includes(d.link));

    for (const newsItem of newNews) {
      const previewImage = await getPreviewImage(newsItem.link);
      const embed = new EmbedBuilder()
        .setTitle(newsItem.title)
        .setURL(newsItem.link)
        .setTimestamp()
        .setColor("#FF0000")
        .setImage(previewImage!)
        .setFooter({
          text: "Realme News",
        });

      await client.send({ embeds: [embed] });
      console.log("Sent " + newsItem.title);
    }
  } catch (err) {
    console.error(err);
  }
}

checkForNewNews();
setInterval(checkForNewNews, 1000 * 60 * 10);
