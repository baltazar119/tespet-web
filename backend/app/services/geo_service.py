from math import radians, sin, cos, sqrt, atan2
from sqlalchemy.orm import Session
from app.models.policy import Policy
from app.models.claim import Claim, PriorityLevel


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    φ1, φ2 = radians(lat1), radians(lat2)
    Δφ = radians(lat2 - lat1)
    Δλ = radians(lon2 - lon1)
    a = sin(Δφ / 2) ** 2 + cos(φ1) * cos(φ2) * sin(Δλ / 2) ** 2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))


def find_affected_policies(
    db: Session,
    disaster_lat: float,
    disaster_lon: float,
    radius_km: float,
    insurer_id: int | None = None,
) -> list[dict]:
    query = db.query(Policy)
    if insurer_id:
        query = query.filter(Policy.insurer_id == insurer_id)

    affected = []
    for policy in query.all():
        if policy.property_lat is None or policy.property_lon is None:
            continue
        dist = haversine_km(disaster_lat, disaster_lon, policy.property_lat, policy.property_lon)
        if dist <= radius_km:
            # Öncelik skoru: mesafe yakınlığı %60 + teminat büyüklüğü %40
            proximity_score = 1 - (dist / radius_km)
            coverage_score = min(policy.coverage_amount / 5_000_000, 1.0)
            priority_score = proximity_score * 0.6 + coverage_score * 0.4
            affected.append({
                "policy": policy,
                "distance_km": round(dist, 2),
                "priority_score": round(priority_score, 3),
            })

    return sorted(affected, key=lambda x: x["priority_score"], reverse=True)


def score_to_priority(score: float) -> PriorityLevel:
    if score >= 80:
        return PriorityLevel.critical
    elif score >= 60:
        return PriorityLevel.high
    elif score >= 35:
        return PriorityLevel.medium
    return PriorityLevel.low
