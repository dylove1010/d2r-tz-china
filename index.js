import axios from 'axios';
import puppeteer from 'puppeteer';
import http from 'http';
import cron from 'node-cron';
import crypto from 'crypto';

const URL = 'https://d2emu.com/tz-china';
const WEBHOOK = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=b0bcfe46-3aa1-4071-afd5-da63be5a8644';

const PORT = process.env.PORT || 3000;
http.createServer((_, res) => res.end('ok'))
    .listen(PORT, '0.0.0.0', () => console.log(`Listening on ${PORT}`)));

async function screenshotAndPush() {
  let browser;
  try {
    console.log('[Screenshot] 启动浏览器...');
    browser = await puppeteer.launch({
      executablePath: undefined,                      // 自动下载
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
      defaultViewport: { width: 1280, height: 720 }
    });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'zh-CN' });
    await page.goto(URL, { waitUntil: 'networkidle2' });
    const png = await page.screenshot({ fullPage: true, type: 'png' });
    await browser.close();

    const base64 = png.toString('base64');
    const md5 = crypto.createHash('md5').update(png).digest('hex');

    console.log('[Push] 推送截图...');
    await axios.post(WEBHOOK, {
      msgtype: 'image',
      image: { base64, md5 }
    });
    console.log('[Push] 截图已发送');
  } catch (e) {
    console.error('[Screenshot] 失败', e.message);
    if (browser) await browser.close();
  }
}

cron.schedule('*/30 * * * * *', screenshotAndPush);
screenshotAndPush();
