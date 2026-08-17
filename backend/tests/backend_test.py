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


@pytest.fixture(scope="session")
def any_restaurant_id(tokens):
    rows = requests.get(f"{API}/superadmin/restaurants", headers=auth(tokens, "superadmin"), timeout=15).json()
    if not rows:
        pytest.skip("No restaurant available")
    return rows[0]["id"]


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

    def test_restaurant_categories_crud(self, tokens, any_restaurant_id):
        h = auth(tokens, "superadmin")
        rid = any_restaurant_id
        r = requests.post(f"{API}/superadmin/restaurants/{rid}/categories", json={"name": "Categoria Teste"}, headers=h, timeout=15)
        assert r.status_code == 200
        cat_id = r.json()["id"]
        r = requests.get(f"{API}/superadmin/restaurants/{rid}/categories", headers=h, timeout=15)
        assert r.status_code == 200
        assert any(c["id"] == cat_id for c in r.json())
        r = requests.post(f"{API}/superadmin/restaurants/{rid}/categories", json={"id": cat_id, "name": "Categoria Renomeada", "sort_order": 5}, headers=h, timeout=15)
        assert r.status_code == 200
        r = requests.patch(f"{API}/superadmin/restaurants/{rid}/categories/{cat_id}/toggle", headers=h, timeout=15)
        assert r.status_code == 200
        r = requests.patch(f"{API}/superadmin/restaurants/{rid}/categories/{cat_id}/delete", headers=h, timeout=15)
        assert r.status_code == 200
        r = requests.get(f"{API}/superadmin/restaurants/{rid}/categories", headers=h, timeout=15)
        assert not any(c["id"] == cat_id for c in r.json())

    def test_restaurant_update_profile(self, tokens, any_restaurant_id):
        h = auth(tokens, "superadmin")
        rid = any_restaurant_id
        r = requests.post(f"{API}/superadmin/restaurants", json={"action": "update_profile", "id": rid, "phone": "11999999999"}, headers=h, timeout=15)
        assert r.status_code == 200
        rows = requests.get(f"{API}/superadmin/restaurants", headers=h, timeout=15).json()
        row = next(x for x in rows if x["id"] == rid)
        assert row.get("phone") == "11999999999"

    def test_restaurant_assign_plan(self, tokens, any_restaurant_id):
        h = auth(tokens, "superadmin")
        plans = requests.get(f"{API}/superadmin/plans", headers=h, timeout=15).json()
        active_plan = next((p for p in plans if p.get("is_active")), None)
        if not active_plan:
            pytest.skip("No active plan available")
        r = requests.post(f"{API}/superadmin/restaurants", json={"action": "assign_plan", "id": any_restaurant_id, "plan_id": active_plan["id"]}, headers=h, timeout=15)
        assert r.status_code == 200

    def test_restaurant_payments_list(self, tokens, any_restaurant_id):
        r = requests.get(f"{API}/superadmin/restaurants/{any_restaurant_id}/payments", headers=auth(tokens, "superadmin"), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_asaas_settings_masking_and_blank_preserve(self, tokens):
        # This suite runs against the same shared settings store real admins use
        # (no isolated test DB in this environment) — never overwrite real,
        # already-configured Asaas credentials, and always clean up after ourselves.
        h = auth(tokens, "superadmin")
        before = requests.get(f"{API}/superadmin/settings", headers=h, timeout=15).json()
        if before.get("asaas_api_key_configured") or before.get("asaas_webhook_secret_configured"):
            pytest.skip("Asaas already configured with real credentials — skipping to avoid overwriting them.")
        try:
            r = requests.post(f"{API}/superadmin/settings", json={"asaas_api_key": "test-key-123", "asaas_base_url": "https://sandbox.asaas.com/api/v3", "asaas_webhook_secret": "secret-abc"}, headers=h, timeout=15)
            assert r.status_code == 200
            r = requests.get(f"{API}/superadmin/settings", headers=h, timeout=15)
            d = r.json()
            assert d["asaas_api_key_configured"] is True
            assert d["asaas_api_key"] == ""
            assert d["asaas_webhook_secret_configured"] is True
            assert d["asaas_webhook_secret"] == ""
            assert d["asaas_base_url"] == "https://sandbox.asaas.com/api/v3"
            # Posting blank secrets must not overwrite the stored values
            r = requests.post(f"{API}/superadmin/settings", json={"asaas_api_key": "", "asaas_webhook_secret": ""}, headers=h, timeout=15)
            assert r.status_code == 200
            r = requests.get(f"{API}/superadmin/settings", headers=h, timeout=15)
            d = r.json()
            assert d["asaas_api_key_configured"] is True
            assert d["asaas_webhook_secret_configured"] is True
        finally:
            # Restore the pre-test (unconfigured) state instead of leaving test fixtures behind
            # in the shared settings store. There's no dedicated delete endpoint for app_settings
            # (by design — it's an admin-only overwrite API), so we clean up directly via the DB.
            import pymongo
            mongo = pymongo.MongoClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
            mongo[os.environ.get("DB_NAME", "test_database")].app_settings.delete_many(
                {"setting_key": {"$in": ["asaas_api_key", "asaas_base_url", "asaas_webhook_secret"]}}
            )
            mongo.close()


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
