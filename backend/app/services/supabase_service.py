import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any
import httpx

from app.config import settings
from app.models.schemas import Itinerary, SaveItineraryRequest

logger = logging.getLogger(__name__)


class SupabaseService:
    def __init__(self):
        self.storage_file = settings.LOCAL_STORAGE_FILE
        self._ensure_local_storage_dir()

    @property
    def url(self) -> str:
        return settings.SUPABASE_URL

    @property
    def key(self) -> str:
        return settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    @property
    def is_configured(self) -> bool:
        return bool(self.url and self.key)

    def _ensure_local_storage_dir(self):
        self.storage_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.storage_file.exists():
            with open(self.storage_file, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _get_headers(self) -> Dict[str, str]:
        return {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation"
        }

    async def save_itinerary(self, req: SaveItineraryRequest) -> Dict[str, Any]:
        """
        Saves itinerary to Supabase table 'itineraries' if configured,
        otherwise saves to local persistent JSON file.
        """
        itin = req.itinerary
        itin_id = itin.id or str(uuid.uuid4())
        created_at = itin.created_at or datetime.now(timezone.utc).isoformat()

        record = {
            "id": itin_id,
            "title": itin.title,
            "destination": itin.destination,
            "duration_days": itin.duration_days,
            "budget_level": itin.budget_level,
            "travel_style": itin.travel_style,
            "number_of_travelers": itin.number_of_travelers,
            "estimated_total_cost": itin.estimated_total_cost,
            "notes": req.user_notes or itin.notes or "",
            "is_demo_mode": itin.is_demo_mode,
            "data": itin.model_dump(),
            "created_at": created_at,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        fallback_reason = None
        if self.is_configured:
            try:
                table_url = f"{self.url}/rest/v1/itineraries"
                async with httpx.AsyncClient(timeout=15.0) as client:
                    # Upsert using Supabase REST API
                    resp = await client.post(
                        table_url,
                        headers=self._get_headers(),
                        json=record
                    )
                    if resp.status_code in [200, 201]:
                        res_json = resp.json()
                        saved_row = res_json[0] if isinstance(res_json, list) and res_json else record
                        return {
                            "status": "success",
                            "storage": "supabase",
                            "itinerary_id": itin_id,
                            "record": saved_row,
                            "message": "Successfully saved to Supabase cloud database."
                        }
                    else:
                        error_detail = resp.text
                        try:
                            err_json = resp.json()
                            error_detail = err_json.get("hint") or err_json.get("message") or error_detail
                        except Exception:
                            pass
                        fallback_reason = f"HTTP {resp.status_code}: {error_detail}"
                        logger.warning(
                            "Supabase save failed with HTTP %s: %s. Falling back to local storage.",
                            resp.status_code, resp.text
                        )
            except Exception as e:
                fallback_reason = str(e)
                logger.error("Exception connecting to Supabase: %s. Saving locally.", str(e))

        # Local fallback
        return self._save_locally(record, fallback_reason=fallback_reason)

    def _save_locally(self, record: Dict[str, Any], fallback_reason: Optional[str] = None) -> Dict[str, Any]:
        try:
            with open(self.storage_file, "r+", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                except Exception:
                    data = []

                # Check if updating existing
                existing_idx = next((i for i, item in enumerate(data) if item.get("id") == record["id"]), None)
                if existing_idx is not None:
                    data[existing_idx] = record
                else:
                    data.insert(0, record)

                f.seek(0)
                f.truncate()
                json.dump(data, f, indent=2)

            msg = "Saved to local persistent file. (Set SUPABASE_URL and SUPABASE_ANON_KEY to sync to cloud)."
            if fallback_reason:
                msg = f"Saved locally as fallback ({fallback_reason})."
            elif self.is_configured:
                msg = "Saved to local persistent file."

            return {
                "status": "success",
                "storage": "local_storage",
                "itinerary_id": record["id"],
                "record": record,
                "message": msg
            }
        except Exception as e:
            logger.error("Error saving locally: %s", str(e))
            raise RuntimeError(f"Failed to persist itinerary: {str(e)}")

    async def list_itineraries(self) -> List[Dict[str, Any]]:
        """
        Retrieves list of saved itineraries from Supabase or local storage.
        """
        if self.is_configured:
            try:
                table_url = f"{self.url}/rest/v1/itineraries?select=*&order=created_at.desc"
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.get(table_url, headers=self._get_headers())
                    if resp.status_code == 200:
                        return resp.json()
                    logger.warning("Supabase list returned %s: %s", resp.status_code, resp.text)
            except Exception as e:
                logger.error("Error fetching from Supabase: %s", str(e))

        # Fallback to local
        try:
            with open(self.storage_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    async def get_itinerary(self, itinerary_id: str) -> Optional[Dict[str, Any]]:
        """
        Gets a single itinerary by ID.
        """
        if self.is_configured:
            try:
                table_url = f"{self.url}/rest/v1/itineraries?id=eq.{itinerary_id}&select=*"
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.get(table_url, headers=self._get_headers())
                    if resp.status_code == 200:
                        rows = resp.json()
                        if rows:
                            return rows[0]
            except Exception as e:
                logger.error("Error getting itinerary from Supabase: %s", str(e))

        # Fallback
        items = await self.list_itineraries()
        return next((item for item in items if item.get("id") == itinerary_id), None)

    async def delete_itinerary(self, itinerary_id: str) -> bool:
        """
        Deletes an itinerary by ID.
        """
        if self.is_configured:
            try:
                table_url = f"{self.url}/rest/v1/itineraries?id=eq.{itinerary_id}"
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.delete(table_url, headers=self._get_headers())
                    if resp.status_code in [200, 204]:
                        return True
            except Exception as e:
                logger.error("Error deleting from Supabase: %s", str(e))

        # Fallback to local
        try:
            with open(self.storage_file, "r+", encoding="utf-8") as f:
                data = json.load(f)
                filtered = [item for item in data if item.get("id") != itinerary_id]
                f.seek(0)
                f.truncate()
                json.dump(filtered, f, indent=2)
            return True
        except Exception as e:
            logger.error("Error deleting locally: %s", str(e))
            return False

    async def update_notes(self, itinerary_id: str, notes: str) -> Optional[Dict[str, Any]]:
        """
        Updates personal notes for a saved itinerary.
        """
        item = await self.get_itinerary(itinerary_id)
        if not item:
            return None

        item["notes"] = notes
        item["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Save back
        req = SaveItineraryRequest(
            itinerary=Itinerary(**item.get("data", item)),
            user_notes=notes
        )
        res = await self.save_itinerary(req)
        return res.get("record")


supabase_service = SupabaseService()
