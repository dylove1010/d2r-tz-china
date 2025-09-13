import axios from 'axios';
import http from 'http';
import cron from 'node-cron';

const URL = 'https://d2emu.com/api/tz-china';   // 中文 JSON 接口
const WEBHOOK = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=45022bb5-22a7-468c-a750-4f3c89ed4253';
let lastHash = '';

/* ----- 占端口，让 Render 通过健康检查 ----- */
const PORT = process.env.PORT || 3000;
http.createServer((_, res) => res.end('ok'))
    .listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`)));

/* ----- 主检查 ----- */
async function check() {
  try {
    console.log('[Check] 开始抓取...');
    const { zone, time } = (await axios.get(URL, { timeout: 10000 })).data;
    const text = `${zone} (${time})`;

    /* 哈希对比 */
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
    const content = `**${title}**\n>${text}`;
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
