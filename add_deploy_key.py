import urllib.request, json

token = "***="
payload = json.dumps({
    "title": "deploy-key",
    "key": "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGlWyg+fsLMmkqnLUjIO3GnH/hk1cAnFuhusPqEA+P+W",
    "read_only": False
}).encode()

req = urllib.request.Request(
    "https://api.github.com/repos/achen4314/ssp-coach-pro/keys",
    data=payload,
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    method="POST"
)
try:
    resp = urllib.request.urlopen(req)
    print(resp.read().decode())
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode())
