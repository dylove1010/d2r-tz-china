import axios from 'axios';
import * as cheerio from 'cheerio';
import http from 'http';
import cron from 'node-cron';

const URL     = 'https://d2emu.com/tz-china';
const SERVER_KEY = process.env.SERVER_KEY;   // Server 酱 SendKey
let lastHash = '';

/* ---------- 占端口，让 Render 通过健康检查 ---------- */
const PORT = process.env.PORT || 3000;
http.createServer((_, res) => res.end('ok'))
    .listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`));

/* ---------- 主检查 ---------- */
async function check() {
  try {
    console.log('[Check] 开始抓取...');
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    /* 1. 整个正文 */
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    /* 2. 算哈希 */
    const hash = Buffer.from(text).toString('base64').slice(0, 32);
    console.log('[Check] 本次哈希', hash);

      if (!lastHash) lastHash = 'force-trigger-' + Date.now();
    if (lastHash && hash !== lastHash) {
      console.log('[Check] 检测到变化，推送中...');
      await push('网页已更新', text);   // 标题 + 正文
    } else {
      console.log('[Check] 无变化');
    }
    lastHash = hash;
  } catch (e) {
    console.error('[Check] 抓取失败', e.message);
  }
}

/* ---------- 微信推送 ---------- */
async function push(title, text) {
  if (!SERVER_KEY) return;
  try {
   const desp = text
  .replace(/\s+/g, ' ')   // 去换行
  .slice(0, 40);          // 先截到 40 字
    await axios.post(
      `https://sctapi.ftqq.com/${SERVER_KEY}.send`,
      { title, desp }
    );
    console.log('[Push] desp长度=', desp.length);
  } catch (e) {
    console.error('[Push] 失败', e.response?.data || e.message);
  }
}

/* 30 分钟一次，立即跑一次 */
cron.schedule('*/30 * * * * *', check);
check();
