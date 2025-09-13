import axios  from 'axios';
import * as cheerio from 'cheerio';
import http   from 'http';
import cron   from 'node-cron';

const URL        = 'https://d2emu.com/tz-china';
const SERVER_KEY = process.env.SERVER_KEY;   // Server 酱 SendKey
let lastHash = '';

/* ----- 占端口，让 Render 通过健康检查 ----- */
const PORT = process.env.PORT || 3000;
http.createServer((_, res) => res.end('ok'))
    .listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`));

/* ----- 主检查 ----- */
async function check() {
  try {
    console.log('[Check] 开始抓取...');
    const { data } = await axios.get(URL, { timeout: 10000 });
    const $ = cheerio.load(data);

    /* 1. 只拿“当前恐怖区域”文本块 */
    const rawText = $('.tooltip-container').text().trim();   // 核心正文
    const text = rawText.replace(/\s+/g, ' ');               // 去换行

    
   const desp = text.slice(0, 600);   // Server 酱上限约 60 k，600 字安全

    /* 3. 哈希对比 */
    const hash = Buffer.from(text).toString('base64').slice(0, 32);
    if (!lastHash) lastHash = 'force-trigger-' + Date.now(); // 第一次必推
    if (hash !== lastHash) {
      console.log('[Check] 检测到变化，推送中...');
      await push('网页已更新', desp);
    } else {
      console.log('[Check] 无变化');
    }
    lastHash = hash;
  } catch (e) {
    console.error('[Check] 抓取失败', e.message);
  }
}

/* ----- 微信推送 ----- */
async function push(title, desp) {
  if (!SERVER_KEY) return;
  try {
    await axios.post(
      `https://sctapi.ftqq.com/${SERVER_KEY}.send`,
      { title, desp }
    );
    console.log('[Push] 已发送');
  } catch (e) {
    console.error('[Push] 失败', e.response?.data || e.message);
  }
}

/* 30 秒一次，立即跑一次（测试完改回 30 分钟） */
cron.schedule('*/30 * * * *', check);
//check();
