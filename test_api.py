import urllib.request, json, os

BASE = "https://ssp-coach-pro.onrender.com"

def api(method, path, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return 0, str(e)

code, data = api("POST", "/api/v1/auth/login", {"username":"coach1","password":"coach123"})
print(f"1. Login: {code} user={data.get('user',{}).get('display_name','?')}")
token = data.get("token","")

code, data = api("POST", "/api/v1/athletes/", {
    "name":"测试王五","phone":"13900002222","gender":"女",
    "source":"大众点评","hyrox_interest":"观望","sport_background":"零基础"
}, token)
print(f"2. Create Athlete: {code} id={data.get('id','?')}")
aid = data.get("id", 1)

code, data = api("POST", "/api/v1/assessments/", {
    "athlete_id": aid, "assessment_date": "2026-06-22",
    "source":"大众点评","hyrox_interest":"观望","sport_background":"零基础",
    "trial_class":"团课体验",
    "cardio_endurance":2,"running_ability":2,"lower_body_strength":3,
    "upper_body_pushpull":2,"core_stability":3,"motor_coordination":4,
    "fatigue_resistance":2,"training_willingness":4,"completion_state":3,
    "hyrox_potential":2,"top_weaknesses":["心肺耐力不足"],
    "coach_feedback":"基础较弱"
}, token)
print(f"3. Assessment: {code} total={data.get('total_score','?')} type={data.get('client_type','?')}")

code, data = api("GET", "/api/v1/athletes/", token=token)
print(f"4. Athletes: {code} total={data.get('total',0)}")

code, data = api("GET", "/api/v1/assessments/", token=token)
print(f"5. Assessments: {code} total={data.get('total',0)}")

for p in ["/api/v1/dashboard/stats","/api/v1/dashboard/funnel","/api/v1/dashboard/audience","/api/v1/dashboard/todos","/api/v1/dashboard/source-conversion"]:
    code, _ = api("GET", p, token=token)
    print(f"   {p}: {code}")

print("\nALL DONE")
