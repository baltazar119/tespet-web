import os
import httpx
from pathlib import Path

SENTINEL_HUB_CLIENT_ID = os.getenv("SENTINEL_HUB_CLIENT_ID", "")
SENTINEL_HUB_CLIENT_SECRET = os.getenv("SENTINEL_HUB_CLIENT_SECRET", "")

CACHE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "satellite_cache"

# Önbelleklenmiş görüntü koordinatları (demo afet lokasyonlarına yakın bölgeler)
CACHED_REGIONS = [
    {"lat": 37.57, "lon": 36.93, "label": "kahramanmaras", "file": "kahramanmaras_after.jpg"},
    {"lat": 41.00, "lon": 28.97, "label": "istanbul",      "file": "istanbul_demo.jpg"},
    {"lat": 38.41, "lon": 27.14, "label": "izmir",         "file": "izmir_demo.jpg"},
    {"lat": 37.88, "lon": 32.49, "label": "konya",         "file": "konya_demo.jpg"},
    {"lat": 39.92, "lon": 32.85, "label": "ankara",        "file": "ankara_demo.jpg"},
]


def _find_closest_cached(lat: float, lon: float) -> Path | None:
    from app.services.geo_service import haversine_km

    best_file = None
    best_dist = float("inf")
    for region in CACHED_REGIONS:
        dist = haversine_km(lat, lon, region["lat"], region["lon"])
        candidate = CACHE_DIR / region["file"]
        if dist < best_dist and candidate.exists():
            best_dist = dist
            best_file = candidate

    return best_file if best_dist < 500 else None  # 500 km içindeyse kullan


async def fetch_satellite_image(lat: float, lon: float) -> bytes | None:
    """Koordinata göre uydu görüntüsü getir. Önce cache, sonra Sentinel Hub."""

    # 1. Önbellekten bak
    cached = _find_closest_cached(lat, lon)
    if cached:
        return cached.read_bytes()

    # 2. Sentinel Hub API
    if SENTINEL_HUB_CLIENT_ID and SENTINEL_HUB_CLIENT_SECRET:
        return await _fetch_from_sentinel_hub(lat, lon)

    return None


async def _fetch_from_sentinel_hub(lat: float, lon: float) -> bytes | None:
    delta = 0.05  # ~5 km
    bbox = [lon - delta, lat - delta, lon + delta, lat + delta]

    token_url = "https://services.sentinel-hub.com/oauth/token"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(token_url, data={
            "grant_type": "client_credentials",
            "client_id": SENTINEL_HUB_CLIENT_ID,
            "client_secret": SENTINEL_HUB_CLIENT_SECRET,
        })
        if token_resp.status_code != 200:
            return None
        token = token_resp.json()["access_token"]

        evalscript = """
//VERSION=3
function setup() { return { input: ["B04","B03","B02"], output: { bands: 3 } }; }
function evaluatePixel(sample) {
  return [3.5*sample.B04, 3.5*sample.B03, 3.5*sample.B02];
}"""

        payload = {
            "input": {
                "bounds": {"bbox": bbox, "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}},
                "data": [{"type": "sentinel-2-l2a", "dataFilter": {"mosaickingOrder": "mostRecent"}}]
            },
            "output": {"width": 512, "height": 512, "responses": [{"identifier": "default", "format": {"type": "image/jpeg"}}]},
            "evalscript": evalscript
        }

        img_resp = await client.post(
            "https://services.sentinel-hub.com/api/v1/process",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=30.0
        )
        if img_resp.status_code == 200:
            return img_resp.content

    return None
