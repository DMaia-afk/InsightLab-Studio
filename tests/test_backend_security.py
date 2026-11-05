"""Minimum security guards for local single-admin MVP. Run: pytest -q tests/test_backend_security.py"""
import os
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from fastapi.testclient import TestClient
from app import app


def test_admin_endpoints_require_token(monkeypatch):
    monkeypatch.delenv('INSIGHTLAB_ADMIN_TOKEN',raising=False)
    c=TestClient(app)
    assert c.get('/api/ai/config').status_code==401
    assert c.get('/api/ai/logs').status_code==401
    assert c.delete('/api/ai/logs').status_code==401


def test_admin_token_is_checked(monkeypatch):
    monkeypatch.setenv('INSIGHTLAB_ADMIN_TOKEN','an-example-token-that-is-not-a-real-secret')
    c=TestClient(app)
    assert c.get('/api/ai/config',headers={'Authorization':'Bearer invalid'}).status_code==401
    r=c.get('/api/ai/config',headers={'Authorization':'Bearer an-example-token-that-is-not-a-real-secret'})
    assert r.status_code==200
    assert 'api_key' not in r.json()


def test_cors_restricts_unknown_origins():
    c=TestClient(app)
    headers={'Origin':'https://untrusted.invalid','Access-Control-Request-Method':'GET'}
    r=c.options('/api/ai/config',headers=headers)
    assert r.headers.get('access-control-allow-origin') is None
    assert r.status_code==400
