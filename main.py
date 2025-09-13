import requests
import time
import schedule
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# 替换成你的企业微信Webhook地址
WEBHOOK_URL = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=b0bcfe46-3aa1-4071-afd5-da63be5a8644"

def send_alert(message):
    """发送通知到企业微信"""
    requests.post(WEBHOOK_URL, json={
        "msgtype": "text",
        "text": {"content": message}
    })

def check_update():
    """检查网站更新"""
    print("正在检查恐怖地带...")
    try:
        # 设置无头浏览器
        options = Options()
        options.add_argument('--no-sandbox')  # Render必须加这个
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--headless')  # 无界面模式
        
        # 使用Chromium（Render已预装）
        driver = webdriver.Chrome(options=options)
        driver.get("https://d2r.icyphyx.com/tz/")
        time.sleep(3)  # 等待页面加载
        
        # 获取页面文本内容
        content = driver.page_source
        driver.quit()
        
        # 提取关键信息（示例）
        if "Current Terror Zone:" in content:
            zone_info = content.split("Current Terror Zone:")[1].split("<")[0].strip()
            send_alert(f"【暗黑2恐怖地带更新】\n{zone_info}")
            print("通知已发送")
    except Exception as e:
        print("出错:", e)

# 每5分钟检查一次
schedule.every(5).minutes.do(check_update)

print("监控程序已启动...")
while True:
    schedule.run_pending()
    time.sleep(30)
