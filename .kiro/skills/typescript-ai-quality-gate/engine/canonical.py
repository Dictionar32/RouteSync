import hashlib, json

def canonical_bytes(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()

def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()

def sha256_json(value):
    return sha256_bytes(canonical_bytes(value))
