import axios  from 'axios';
import * as cheerio from 'cheerio';
import http   from 'http';
import cron   from 'node-cron';

const URL     = 'https://d2emu.com/tz-china';
const WEBHOOK = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=b0bcfe46-3aa1-4071-afd5-da63be5a8644';
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
    const rawText = $('.tooltip-container').text().trim();
    const text = rawText.replace(/\s+/g, ' ');   // 去换行

    /* 2. 哈希对比 */
    const hash = Buffer.from(text).toString('base64').slice(0, 32);
    if (!lastHash) lastHash = 'force-trigger-' + Date.now();
    if (hash !== lastHash) {
      console.log('[Check] 检测到变化，推送中...');
      await push('网页已更新', text);
    } else {
      console.log('[Check] 无变化');
    }
    lastHash = hash;
  } catch (e) {
    console.error('[Check] 抓取失败', e.message);
  }
}

/* ----- 企业微信机器人推送 ----- */
async function push(title, text) {
  if (!WEBHOOK) return;
  try {
    /* Markdown 格式，微信内直接展开全文 */
    const content = `**${title}**\n>${text.slice(0, 2000)}`;
    await axios.post(WEBHOOK, {
      msgtype: 'markdown',
      markdown: { content }
    });
    console.log('[Push] 企业微信机器人已发送');
  } catch (e) {
    console.error('[Push] 机器人失败', e.response?.data || e.message);
  }
}

/* 30 秒一次，立即跑一次（测试完改回 30 分）*/
cron.schedule('*/30 * * * * *', check);
check();
