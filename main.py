import requests
import time
import schedule
from datetime import datetime

# 替换成你的Webhook地址
WEBHOOK_URL = "你的Webhook地址"

def send_alert(message):
    """发送通知到企业微信"""
    requests.post(WEBHOOK_URL, json={
        "msgtype": "text",
        "text": {"content": message}
    })

def check_update():
    """检查网站更新"""
    print("正在检查...")
    try:
        # 获取网页内容
        r = requests.get("https://d2r.icyphyx.com/tz/", timeout=10)
        content = r.text
        
        # 提取关键信息（示例，可根据实际网页调整）
        if "Current Terror Zone:" in content:
            zone_info = content.split("Current Terror Zone:")[1].split("<")[0].strip()
            send_alert(f"【暗黑2恐怖地带更新】\n{zone_info}")
            print("已发送通知")
    except Exception as e:
        print("出错:", e)

# 每5分钟检查一次
schedule.every(5).minutes.do(check_update)

print("监控程序已启动...")
while True:
    schedule.run_pending()
    time.sleep(30)
