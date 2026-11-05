"""Backward-compatible language field validation for the configured AI API."""
import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
import pytest
from pydantic import ValidationError
from app import ChatRequest, GenerateRequest, DataProfile


def profile():
    return DataProfile(row_count=0, columns=[])


def test_legacy_requests_still_default_to_portuguese():
    assert ChatRequest(question='Quantos registros?', profile=profile()).locale == 'pt-BR'
    assert GenerateRequest(instruction='Criar um dashboard', profile=profile()).locale == 'pt-BR'


def test_english_requests_are_accepted():
    assert ChatRequest(question='How many records?', profile=profile(), locale='en').locale == 'en'
    assert GenerateRequest(instruction='Create a dashboard', profile=profile(), locale='en').locale == 'en'


def test_unsupported_locale_is_rejected():
    with pytest.raises(ValidationError):
        ChatRequest(question='How many records?', profile=profile(), locale='fr')
