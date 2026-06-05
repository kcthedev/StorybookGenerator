import json
from pathlib import Path

import google.auth.transport.requests
import httpx
from google import genai
from google.oauth2 import service_account

BACKEND_DIR = Path(__file__).resolve().parents[1]
path = BACKEND_DIR / "google_config.json"
data = json.loads(path.read_text(encoding="utf-8"))
project = data["project_id"]
creds = service_account.Credentials.from_service_account_file(
    str(path),
    scopes=["https://www.googleapis.com/auth/cloud-platform"],
)
prompt = "Soft marimba and light piano, instrumental only. No vocals, no lyrics."

REGIONS = [
    "us-west1",
    "us-east1",
    "us-east4",
    "us-central1",
    "global",
]

print("Project:", project)

for region in REGIONS:
    client = genai.Client(
        vertexai=True,
        project=project,
        location=region,
        credentials=creds,
    )
    for model in ["lyria-3-clip-preview", "lyria-3-pro-preview"]:
        try:
            interaction = client.interactions.create(model=model, input=prompt)
            outputs = interaction.outputs or []
            audio = [
                output
                for output in outputs
                if getattr(output, "inline_data", None) and output.inline_data.data
            ]
            print(
                f"OK interactions {region} {model}: "
                f"status={getattr(interaction, 'status', None)} "
                f"outputs={len(outputs)} audio={len(audio)}"
            )
        except Exception as exc:
            short = str(exc).split("\n", maxsplit=1)[0][:180]
            print(f"FAIL interactions {region} {model}: {short}")

creds.refresh(google.auth.transport.requests.Request())
token = creds.token
for region in REGIONS:
    if region == "global":
        url = (
            f"https://aiplatform.googleapis.com/v1/projects/{project}/"
            f"locations/global/publishers/google/models/lyria-002:predict"
        )
    else:
        url = (
            f"https://{region}-aiplatform.googleapis.com/v1/projects/{project}/"
            f"locations/{region}/publishers/google/models/lyria-002:predict"
        )
    body = {
        "instances": [
            {
                "prompt": prompt,
                "negative_prompt": "vocals, singing, lyrics, words",
            }
        ],
        "parameters": {},
    }
    try:
        response = httpx.post(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json=body,
            timeout=120,
        )
        if response.status_code == 200:
            print(f"OK predict {region} lyria-002")
        else:
            print(
                f"FAIL predict {region} lyria-002: status={response.status_code} "
                f"body={response.text[:180]}"
            )
    except Exception as exc:
        print(f"FAIL predict {region} lyria-002 exception: {exc}")
