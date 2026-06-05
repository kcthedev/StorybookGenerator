from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_image_model: str = "gpt-image-1"
    gemini_project_id: str = ""
    gemini_location: str = "us-central1"
    gemini_model: str = "gemini-2.5-flash"
    gemini_service_account_file: str = ""
    cors_origins: str = "http://localhost:3000"
    api_public_url: str = "http://localhost:8000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
