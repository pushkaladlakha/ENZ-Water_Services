from typing import List, Optional
from backend.app.repositories.address_repository import address_repository
from backend.app.schemas.address import ParcelFeatureSchema, AddressSearchResponse

class AddressService:
    def search_addresses(self, query: str, limit: int = 10) -> AddressSearchResponse:
        results = address_repository.search_parcels(query, limit=limit)
        return AddressSearchResponse(
            query=query,
            count=len(results),
            results=results
        )

    def get_parcel(self, parcel_id: str) -> Optional[ParcelFeatureSchema]:
        return address_repository.get_parcel_by_id(parcel_id)

    def find_nearest(self, lat: float, lng: float, max_dist_m: float = 80.0) -> Optional[ParcelFeatureSchema]:
        return address_repository.find_nearest_parcel(lat, lng, max_dist_m)

address_service = AddressService()
