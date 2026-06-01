import httpx

from schemas import AppState


class SupabaseStateStore:
    def __init__(self, supabase_url: str, service_role_key: str) -> None:
        self.base_url = supabase_url.rstrip("/")
        self.headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
        }

    def load(self) -> AppState:
        response = httpx.get(
            f"{self.base_url}/rest/v1/techpulse_state",
            headers=self.headers,
            params={"id": "eq.app_state", "select": "payload"},
            timeout=10,
        )
        response.raise_for_status()
        rows = response.json()
        if not rows:
            return AppState()
        return AppState.model_validate(rows[0]["payload"])

    def save(self, state: AppState) -> None:
        response = httpx.post(
            f"{self.base_url}/rest/v1/techpulse_state",
            headers={
                **self.headers,
                "Prefer": "resolution=merge-duplicates",
            },
            json={
                "id": "app_state",
                "payload": state.model_dump(mode="json"),
            },
            timeout=10,
        )
        response.raise_for_status()
