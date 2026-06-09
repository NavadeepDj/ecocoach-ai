import os
import json
import logging
from typing import Any
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to import firebase_admin. If it's missing or fails, we run in mock mode.
MOCK_MODE = True
db_client = None

try:
    import firebase_admin
    from firebase_admin import auth, credentials, firestore

    # Check if service account file is specified and exists
    service_account_path = settings.firebase_service_account
    if service_account_path and os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        db_client = firestore.client()
        MOCK_MODE = False
        logger.info("Firebase Admin initialized successfully in production mode.")
    else:
        logger.warning(
            "Firebase service account credentials not found. EcoCoach will run in Local Developer Mock Mode."
        )
except Exception as e:
    logger.warning(
        f"Failed to initialize Firebase Admin ({e}). Running in Local Developer Mock Mode."
    )


# Local JSON file path for Mock Mode database
MOCK_DB_PATH = Path(__file__).resolve().parent.parent.parent / "mock_firebase_db.json"

def _load_mock_db() -> dict[str, Any]:
    if not MOCK_DB_PATH.exists():
        initial_data = {
            "users": {},
            "footprints": [],
            "latest_footprints": {}
        }
        MOCK_DB_PATH.write_text(json.dumps(initial_data, indent=2), encoding="utf-8")
        return initial_data
    try:
        return json.loads(MOCK_DB_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"users": {}, "footprints": [], "latest_footprints": {}}

def _save_mock_db(data: dict[str, Any]) -> None:
    MOCK_DB_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


class FirebaseService:
    @staticmethod
    def verify_id_token(token: str) -> dict[str, Any]:
        """
        Verify the Firebase ID Token.
        In mock mode, parse simple format 'mock-token-{uid}' or return static mock user.
        """
        if MOCK_MODE:
            uid = "mock-uid-123"
            if token.startswith("mock-token-"):
                uid = token.replace("mock-token-", "")
            
            # Save mock user to mock database
            db = _load_mock_db()
            if uid not in db["users"]:
                db["users"][uid] = {
                    "uid": uid,
                    "email": f"{uid}@example.com",
                    "name": f"EcoUser {uid}"
                }
                _save_mock_db(db)

            return {
                "uid": uid,
                "email": f"{uid}@example.com",
                "name": f"EcoUser {uid}"
            }
        
        # Real verification
        decoded_token = auth.verify_id_token(token)
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name", "EcoUser")
        }

    @staticmethod
    def save_footprint(uid: str, footprint_data: dict[str, Any]) -> None:
        """
        Save a user's footprint to history and update their latest footprint.
        """
        import datetime
        timestamp = datetime.datetime.utcnow().isoformat()
        record = {
            **footprint_data,
            "uid": uid,
            "created_at": timestamp
        }

        if MOCK_MODE:
            db = _load_mock_db()
            db["footprints"].append(record)
            db["latest_footprints"][uid] = record
            _save_mock_db(db)
            return

        # Real Firestore storage
        # Add to subcollection for history
        db_client.collection("users").document(uid).collection("footprints").add(record)
        # Update/Set in latest_footprints for percentile queries
        db_client.collection("latest_footprints").document(uid).set(record)

    @staticmethod
    def get_history(uid: str) -> list[dict[str, Any]]:
        """
        Retrieve a user's historical footprint snapshots.
        """
        if MOCK_MODE:
            db = _load_mock_db()
            user_footprints = [f for f in db["footprints"] if f.get("uid") == uid]
            return sorted(user_footprints, key=lambda x: x.get("created_at", ""), reverse=True)

        # Real Firestore fetch
        docs = (
            db_client.collection("users")
            .document(uid)
            .collection("footprints")
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .stream()
        )
        return [doc.to_dict() for doc in docs]

    @staticmethod
    def get_comparison(uid: str, current_total: float) -> dict[str, Any]:
        """
        Compare the user's latest footprint against other users' latest footprints.
        Returns percentile ranking and distribution counts.
        """
        totals = []

        if MOCK_MODE:
            db = _load_mock_db()
            totals = [doc["total"] for doc in db["latest_footprints"].values()]
        else:
            # Stream all latest footprints to calculate statistics in memory
            docs = db_client.collection("latest_footprints").stream()
            totals = [doc.to_dict().get("total", 0.0) for doc in docs]

        # Make sure the current total is included if it's not already in the db
        if current_total not in totals:
            totals.append(current_total)

        total_users = len(totals)
        
        # Percentile: count how many users have a strictly worse (larger) footprint
        worse_than_me = sum(1 for t in totals if t > current_total)
        
        if total_users <= 1:
            percentile = 100
        else:
            percentile = round((worse_than_me / total_users) * 100)

        # Build distribution buckets (0-100, 100-200, 200-300, 300-400, 400-500, 500+)
        buckets = {
            "0-100": 0,
            "100-200": 0,
            "200-300": 0,
            "300-400": 0,
            "400-500": 0,
            "500+": 0
        }
        for t in totals:
            if t <= 100:
                buckets["0-100"] += 1
            elif t <= 200:
                buckets["100-200"] += 1
            elif t <= 300:
                buckets["200-300"] += 1
            elif t <= 400:
                buckets["300-400"] += 1
            elif t <= 500:
                buckets["400-500"] += 1
            else:
                buckets["500+"] += 1

        return {
            "percentile": percentile,
            "total_users": total_users,
            "distribution": buckets
        }
