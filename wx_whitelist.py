import urllib.request, json

appid = "wx47ce780b338d6740"
secret = "7e40721a3b8ccc90aee0700aeb2708b4"

# Get access token
url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={secret}"
resp = urllib.request.urlopen(url, timeout=10)
data = json.loads(resp.read())
token = data.get("access_token")
print(f"Token: {token[:20]}..." if token else f"Error: {data}")

if token:
    # Set request domain whitelist
    url2 = f"https://api.weixin.qq.com/wxa/setwebviewdomain?access_token={token}"
    body = json.dumps({"action":"add","webviewdomain":["https://ssp-coach-pro.onrender.com"]}).encode()
    req = urllib.request.Request(url2, data=body, headers={"Content-Type":"application/json"}, method="POST")
    resp2 = urllib.request.urlopen(req, timeout=10)
    print("Domain result:", resp2.read().decode())
