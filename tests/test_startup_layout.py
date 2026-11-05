"""Regression checks for the single-layout boot sequence (v11.2.1)."""
from pathlib import Path
import re

WEB = Path(__file__).resolve().parents[1] / "insightlab_mvp"


def test_stylesheets_are_blocking_in_head():
    html = (WEB / "index.html").read_text(encoding="utf-8")
    head = html.split("</head>", 1)[0]
    body = html.split("</head>", 1)[1]
    assert len(re.findall(r'<link[^>]+rel="stylesheet"', head)) == 14
    assert not re.search(r'<link[^>]+rel="stylesheet"', body)
    assert 'product-ui-v10.css' in head
    assert 'i18n.css' in head


def test_one_workspace_landmark_and_ready_guard():
    html = (WEB / "index.html").read_text(encoding="utf-8")
    story = (WEB / "presentation-studio.js").read_text(encoding="utf-8")
    i18n = (WEB / "i18n.js").read_text(encoding="utf-8")
    assert html.count('<main id="main">') == 1
    assert html.count('<aside aria-label="Navegação lateral"') == 1
    assert 'class="il-story-work" role="region"' in story
    assert '<main class="il-story-work"' not in story
    assert "root.classList.add('il-ui-booting')" in html
    assert "classList.remove('il-ui-booting')" in i18n
    assert "root.dataset.theme=theme==='dark'?'dark':'light'" in html
    assert "root.dataset.locale=lang==='en'?'en':'pt-BR'" in html
