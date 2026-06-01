from config import get_settings
from db.supabase_store import SupabaseStateStore
from db.store import JsonStore
from graph.main_graph import TechPulsePipeline


def get_store() -> JsonStore:
    settings = get_settings()
    store = JsonStore(settings.state_file)
    if settings.supabase_url and settings.supabase_service_role_key:
        supabase_store = SupabaseStateStore(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
        store.state_file.parent.mkdir(parents=True, exist_ok=True)
        store.load = supabase_store.load
        store.save = supabase_store.save
    return store


def get_pipeline() -> TechPulsePipeline:
    settings = get_settings()
    return TechPulsePipeline(get_store(), settings)
