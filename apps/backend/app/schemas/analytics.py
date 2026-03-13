from pydantic import BaseModel, ConfigDict, Field


class AnalyticsTrendPointResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    date: str
    total_inspections: int = Field(alias="totalInspections")
    critical_issues: int = Field(alias="criticalIssues")
    warning_issues: int = Field(alias="warningIssues")
    info_issues: int = Field(alias="infoIssues")
