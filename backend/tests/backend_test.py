"""PlayMenu backend API tests"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or "https://menu-player-app.preview.emergentagent.com"
API = f"{BASE_URL}/api"

CREDENTIALS = {
    "superadmin": ("admin@playmenu.app", "123456"),
    "restaurant": ("modelo1@playmenu.com", "123456"),
    "gerente": ("lula@playmenu.app", "123456"),
    "representante": ("gustavolobo@gmail.com", "123456"),
}


@pytest.fixture(scope="session")
def tokens():
    out = {}
    for role, (email, pw) in CREDENTIALS.items():
        r = requests.post(f"{API}/auth/login", json={"email": email, "password": pw}, timeout=30)
        assert r.status_code == 200, f"Login failed for {role}: {r.status_code} {r.text}"
        out[role] = r.json()
    return out


def auth(role_tokens, role):
    return {"Authorization": f"Bearer {role_tokens[role]['token']}"}


# ---- Health ----
def test_api_root():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert "message" in r.json()


# ---- Auth ----
class TestAuth:
    def test_superadmin_login(self, tokens):
        d = tokens["superadmin"]
        assert d["role"] == "superadmin"
        assert d["redirect"] == "/superadmin"
        assert d["user"]["email"] == "admin@playmenu.app"

    def test_restaurant_login(self, tokens):
        d = tokens["restaurant"]
        assert d["role"] == "restaurant"
        assert d["redirect"] in ("/admin", "/admin/configuracao-inicial")

    def test_gerente_login(self, tokens):
        d = tokens["gerente"]
        assert d["role"] == "gerente"
        assert d["redirect"] == "/gerente"

    def test_representante_login(self, tokens):
        d = tokens["representante"]
        assert d["role"] == "representante"

    def test_bad_login(self):
        r = requests.post(f"{API}/auth/login", json={"email": "admin@playmenu.app", "password": "wrong"}, timeout=15)
        assert r.status_code in (400, 401, 403, 422)

    def test_me(self, tokens):
        r = requests.get(f"{API}/auth/me", headers=auth(tokens, "superadmin"), timeout=15)
        assert r.status_code == 200
        assert r.json()["role"] == "superadmin"

    def test_me_unauthorized(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code in (401, 403)


# ---- SuperAdmin ----
class TestSuperAdmin:
    def test_dashboard(self, tokens):
        r = requests.get(f"{API}/superadmin/dashboard", headers=auth(tokens, "superadmin"), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["restaurants"] >= 1
        assert d["agents"] >= 1
        assert "active_restaurants" in d

    def test_restaurants_list(self, tokens):
        r = requests.get(f"{API}/superadmin/restaurants", headers=auth(tokens, "superadmin"), timeout=15)
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list) and len(rows) >= 1
        assert "password_hash" not in rows[0]

    def test_agents_list(self, tokens):
        r = requests.get(f"{API}/superadmin/agents", headers=auth(tokens, "superadmin"), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list) and len(r.json()) >= 1

    def test_forbidden_for_agent(self, tokens):
        r = requests.get(f"{API}/superadmin/dashboard", headers=auth(tokens, "gerente"), timeout=15)
        assert r.status_code in (401, 403)

    def test_plans(self, tokens):
        r = requests.get(f"{API}/superadmin/plans", headers=auth(tokens, "superadmin"), timeout=15)
        assert r.status_code == 200

    def test_settings(self, tokens):
        r = requests.get(f"{API}/superadmin/settings", headers=auth(tokens, "superadmin"), timeout=15)
        assert r.status_code == 200


# ---- Agent ----
class TestAgent:
    def test_gerente_dashboard(self, tokens):
        r = requests.get(f"{API}/agent/dashboard", headers=auth(tokens, "gerente"), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "active_clients" in d and "total_clients" in d

    def test_representante_dashboard(self, tokens):
        r = requests.get(f"{API}/agent/dashboard", headers=auth(tokens, "representante"), timeout=15)
        assert r.status_code == 200

    def test_agent_restaurants(self, tokens):
        r = requests.get(f"{API}/agent/restaurants", headers=auth(tokens, "gerente"), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_gerente_representatives(self, tokens):
        r = requests.get(f"{API}/agent/representatives", headers=auth(tokens, "gerente"), timeout=15)
        assert r.status_code == 200


# ---- Public ----
class TestPublic:
    def test_public_menu_default(self):
        r = requests.get(f"{API}/public/menu", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "restaurant" in d and "products" in d and "categories" in d

    def test_public_menu_by_slug(self, tokens):
        # Grab an active restaurant slug
        rs = requests.get(f"{API}/superadmin/restaurants", headers=auth(tokens, "superadmin"), timeout=15).json()
        active = next((x for x in rs if x.get("is_active")), None)
        if not active:
            pytest.skip("No active restaurant")
        r = requests.get(f"{API}/public/menu", params={"r": active["slug"]}, timeout=15)
        assert r.status_code == 200
        assert r.json()["restaurant"]["slug"] == active["slug"]

    def test_public_menu_unknown_slug(self):
        r = requests.get(f"{API}/public/menu", params={"r": "no-such-restaurant-xyz"}, timeout=15)
        assert r.status_code == 404


# ---- Restaurant ----
class TestRestaurant:
    def test_restaurant_dashboard_or_similar(self, tokens):
        # Try /me at least
        r = requests.get(f"{API}/auth/me", headers=auth(tokens, "restaurant"), timeout=15)
        assert r.status_code == 200
        assert r.json()["role"] == "restaurant"
