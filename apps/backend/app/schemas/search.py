from pydantic import BaseModel, ConfigDict, Field

from app.schemas.inspection import InspectionSummaryResponse


class SearchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    query: str


class SearchResultResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    inspection: InspectionSummaryResponse
    similarity_score: float = Field(alias="similarityScore")
