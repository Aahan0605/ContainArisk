import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from . import csv_db

# Load .env from the backend/ directory (one level up from app/)
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

# We only create the client if the URL and KEY are provided to avoid crashes
_supabase_client = None
if url and key and key != "YOUR_SUPABASE_KEY_HERE":
    try:
        _supabase_client = create_client(url, key)
        # Quick test to verify connection
        try:
            _supabase_client.table("containers").select("*").limit(1).execute()
            supabase = _supabase_client
            print("✓ Supabase connected successfully")
        except Exception as conn_error:
            print(f"⚠ Supabase connection failed: {conn_error}")
            print("Using CSV fallback for database operations")
            supabase = None
    except Exception as e:
        print(f"⚠ Failed to initialize Supabase: {e}")
        print("Using CSV fallback for database operations")
        supabase = None
else:
    supabase = None
    print(
        "⚠ SUPABASE_URL or SUPABASE_KEY is missing. Using CSV fallback for database operations."
    )


# Provide fallback functions using CSV when Supabase is unavailable
class CSVDatabaseProxy:
    """Proxy that wraps CSV database operations with Supabase-like interface."""

    def table(self, table_name: str):
        """Mimic Supabase table() method."""
        return CSVTableProxy(table_name)


class CSVTableProxy:
    """Proxy for table operations."""

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.query = {}
        self.filters = []
        self.records = []
        self.update_data = {}
        self._operation = None

    def select(self, columns: str = "*"):
        """Store select columns."""
        self.query["select"] = columns
        self._operation = "select"
        return self

    def eq(self, column: str, value):
        """Add equality filter."""
        self.filters.append((column, "eq", value))
        return self

    def limit(self, count: int):
        """Store limit."""
        self.query["limit"] = count
        return self

    def offset(self, count: int):
        """Store offset."""
        self.query["offset"] = count
        return self

    def execute(self):
        """Execute the query against CSV backend."""
        if self._operation == "insert" or self.records:
            if self.table_name == "containers":
                result_data = []
                for rec in self.records:
                    created = csv_db.create_container(rec)
                    result_data.append(created)
                return type("Response", (), {"data": result_data})()
            elif self.table_name == "risk_assessment":
                result_data = []
                for rec in self.records:
                    if rec.get("container_id"):
                        csv_db.save_risk_assessment(rec.get("container_id"), rec)
                    result_data.append(rec)
                return type("Response", (), {"data": result_data})()
            return type("Response", (), {"data": []})()

        if self.table_name == "containers":
            if self.filters and len(self.filters) > 0:
                # Filter by container_id (or container_id)
                for col, op, val in self.filters:
                    if col in ("container_id", "Container_ID"):
                        # Getting single container
                        container = csv_db.get_container(val)
                        return type(
                            "Response", (), {"data": [container] if container else []}
                        )()
            else:
                # Getting multiple containers
                limit = self.query.get("limit", 100)
                offset = self.query.get("offset", 0)
                result = csv_db.get_all_containers(limit, offset)
                return type(
                    "Response", (), {"data": result["data"], "count": result["count"]}
                )()

        return type("Response", (), {"data": []})()

    def insert(self, records):
        """Handle inserts."""
        self.records = records if isinstance(records, list) else [records]
        self._operation = "insert"
        return self

    def upsert(self, records):
        """Handle upserts."""
        self.records = records if isinstance(records, list) else [records]
        self._operation = "upsert"
        return self

    def update(self, data):
        """Store update data."""
        self.update_data = data
        self._operation = "update"
        return self


# Use Supabase if available, otherwise use CSV fallback
if supabase is None:
    supabase = CSVDatabaseProxy()
