import axios from 'axios';
import * as cheerio from 'cheerio';
import cron from 'node-cron';

const URL = 'https://d2emu.com/tz-china';
const SERVER_KEY = process.env.SERVER_KEY;
let lastHash = '';

async function check() {
  try {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);
    const html = $('body').html();
    const hash = Buffer.from(html).toString('base64').slice(0, 32);
    if (lastHash && hash !== lastHash) {
      await push('D2R TZ 页面已更新！');
    }
    lastHash = hash;
  } catch (e) {
    console.error(e.message);
  }
}

async function push(text) {
  if (!SERVER_KEY) return;
  await axios.post(`https://sctapi.ftqq.com/${SERVER_KEY}.send`, {
    title: text,
    desp: new Date().toLocaleString()
  });
}

cron.schedule('*/1 * * * *', check); // 每 1 分钟
check(); // 启动立即跑一次
import http from 'http';
const PORT = process.env.PORT || 3000;
http.createServer((_, res) => res.end('ok')).listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`));
