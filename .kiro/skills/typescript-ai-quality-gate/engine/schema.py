from __future__ import annotations
import json
from pathlib import Path

def validate_attestation(data: dict, schema_path: str | Path) -> list[str]:
    try:
        import jsonschema
    except ImportError:
        return ["jsonschema-validator-unavailable"]
    schema=json.loads(Path(schema_path).read_text(encoding="utf-8"))
    try:
        jsonschema.Draft202012Validator(schema).validate(data)
    except jsonschema.ValidationError as e:
        return ["schema-validation-failed:" + e.message]
    return []
