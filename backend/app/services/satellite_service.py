import os
import math
import httpx
from pathlib import Path

SENTINEL_HUB_CLIENT_ID = os.getenv("SENTINEL_HUB_CLIENT_ID", "")
SENTINEL_HUB_CLIENT_SECRET = os.getenv("SENTINEL_HUB_CLIENT_SECRET", "")

CACHE_DIR = Path(__file__).parent.parent.parent.parent / "data" / "satellite_cache"


def _lat_lon_to_tile(lat: float, lon: float, zoom: int) -> tuple[int, int]:
    lat_r = math.radians(lat)
    n = 2 ** zoom
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.log(math.tan(lat_r) + 1 / math.cos(lat_r)) / math.pi) / 2 * n)
    return x, y


async def fetch_esri_satellite_tile(lat: float, lon: float, zoom: int = 18) -> bytes | None:
    """Esri World Imagery'den gerçek Maxar uydu görüntüsü çek (API anahtarı gerekmez)."""
    x, y = _lat_lon_to_tile(lat, lon, zoom)
    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{y}/{x}"
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.get(url, headers={"User-Agent": "TespetApp/1.0"})
            if resp.status_code == 200 and len(resp.content) > 500:
                return resp.content
    except Exception:
        pass
    return None


async def fetch_satellite_image(lat: float, lon: float) -> bytes | None:
    """Koordinata göre uydu görüntüsü getir. Esri primary, Sentinel Hub fallback."""

    # 1. Esri World Imagery (Maxar — API anahtarı gerekmez)
    img = await fetch_esri_satellite_tile(lat, lon, zoom=18)
    if img:
        return img

    # 2. Sentinel Hub API (credentials varsa)
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
