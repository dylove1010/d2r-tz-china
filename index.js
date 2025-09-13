import axios  from 'axios';
import * as cheerio from 'cheerio';
import http   from 'http';
import cron   from 'node-cron';


const URL     = 'https://d2emu.com/tz-china';          // 网页版
const WEBHOOK = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=b0bcfe46-3aa1-4071-afd5-da63be5a8644';
let lastHash = Date.now().toString();   // 启动必不同，强制推一次（测试完可改回 ''）

/* ----- 占端口，让 Render 通过健康检查 ----- */
const PORT = process.env.PORT || 3000;
http.createServer((_, res) => res.end('ok'))
    .listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`));

/* ----- 主检查 ----- */
async function check() {
  try {
    console.log('[Check] 开始抓取...');
   const { data } = await axios.get(URL, {
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'zh-CN,zh;q=0.9'
  }
    });
    const $ = cheerio.load(data);
    const text = $('.tooltip-container').text().replace(/\s+/g, ' ').trim();

    /* 哈希对比 */
    const hash = Buffer.from(text).toString('base64').slice(0, 32);
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
