import urllib.request, json
token = "***="
pubkey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGlWyg+fsLMmkqnLUjIO3GnH/hk1cAnFuhusPqEA+P+W 35074@111x"
data = json.dumps({"title":"ssp-deploy2","key":pubkey,"read_only":False}).encode()
req = urllib.request.Request("https://api.github.com/repos/achen4314/ssp-coach-pro/keys", data=data, headers={"Authorization":f"Bearer {token}","Content-Type":"application/json"}, method="POST")
try:
    r = urllib.request.urlopen(req)
    print(r.read().decode()[:300])
except Exception as e:
    print(getattr(e,'read',lambda: b'')()) if hasattr(e,'read') else print(e)
