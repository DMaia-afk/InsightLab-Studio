#!/usr/bin/env python3
"""Read-only release hygiene checks. Run from any directory: python scripts/audit_release.py

This is a baseline scanner, NOT a historical Git secret scan or a substitute for
manual review and GitHub's secret scanning features.
"""
from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE_DIRS = {'.git', '.venv', 'venv', '__pycache__', '.pytest_cache', 'node_modules', '.mypy_cache'}
TEXT_EXTENSIONS = {'.py', '.js', '.cjs', '.json', '.html', '.css', '.md', '.yml', '.yaml', '.bat', '.txt', '.ini', '.example', '.xml', '.toml', '.gitignore', '.gitattributes', '.editorconfig'}
BLOCKED_NAMES = {'.insightlab_admin_token', '.env', 'id_rsa', 'id_ed25519', 'credentials.json', 'service-account.json'}
BLOCKED_SUFFIXES = {'.pem', '.p12', '.pfx', '.key', '.sqlite', '.sqlite3', '.db', '.log', '.pyc'}
SECRET_PATTERNS = {
    'OpenAI-style API key': re.compile(r'\bsk-[A-Za-z0-9_-]{24,}\b'),
    'Google API key': re.compile(r'\bAIza[A-Za-z0-9_-]{30,}\b'),
    'GitHub access token': re.compile(r'\bgh[pousr]_[A-Za-z0-9]{20,}\b'),
    'AWS access key': re.compile(r'\b(?:AKIA|ASIA)[0-9A-Z]{16}\b'),
    'Private key content': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
}
class AssetParser(HTMLParser):
    """Collect only literal local assets in HTML tags (not dynamic JS templates)."""

    def __init__(self):
        super().__init__()
        self.assets: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag not in {'script', 'link', 'img'}:
            return
        attrs = dict(attrs)
        candidate = attrs.get('src') or (attrs.get('href') if tag == 'link' else None)
        if candidate:
            self.assets.append(candidate)


EXPECTED = [
    'README.md', 'LICENSE', 'SECURITY.md', 'CONTRIBUTING.md', 'CHANGELOG.md',
    '.gitignore', '.github/workflows/ci.yml', 'backend/.env.example',
    'backend/app.py', 'backend/requirements.txt', 'insightlab_mvp/index.html',
    'insightlab_mvp/query-engine-v105.js', 'insightlab_mvp/integrity-v104.js',
    'tests/stage1_integrity.test.cjs', 'tests/stage2_query_engine.test.cjs',
    'examples/barbearia.csv', 'examples/pizzaria.csv', 'examples/brinquedos.csv',
    'docs/INSTALLATION.md', 'docs/ARCHITECTURE.md', 'docs/TESTING.md',
]


def main() -> int:
    problems: list[str] = []
    checked = 0
    files = [p for p in ROOT.rglob('*') if p.is_file() and not any(x in EXCLUDE_DIRS for x in p.relative_to(ROOT).parts)]
    for f in files:
        rel = f.relative_to(ROOT)
        if f.name in BLOCKED_NAMES or f.suffix.lower() in BLOCKED_SUFFIXES:
            problems.append(f'Arquivo privado no pacote: {rel}')
        if f.suffix.lower() in TEXT_EXTENSIONS or f.name in {'.gitignore', '.gitattributes', '.editorconfig'}:
            try:
                raw = f.read_text(encoding='utf-8')
            except (UnicodeError, OSError):
                problems.append(f'Arquivo de texto ilegível: {rel}')
                continue
            checked += 1
            for name, pattern in SECRET_PATTERNS.items():
                for match in pattern.finditer(raw):
                    line = raw.count('\n', 0, match.start()) + 1
                    problems.append(f'Possível segredo ({name}): {rel}:{line}')
    # Static asset references should exist in the repository; prevents release
    # packages that unexpectedly omit icons or stylesheets.
    page = ROOT / 'insightlab_mvp/index.html'
    if page.exists():
        parser = AssetParser()
        parser.feed(page.read_text(encoding='utf-8'))
        for target in parser.assets:
            if target.startswith(('http://', 'https://', '//', '/', 'data:', '#')) or '${' in target:
                continue
            path = target.split('?', 1)[0].split('#', 1)[0]
            if not (page.parent / path).exists():
                problems.append(f'Asset HTML ausente: insightlab_mvp/{path}')
    # Public doc links should not break when the user opens the GitHub README.
    for doc in [ROOT / 'README.md', *sorted((ROOT / 'docs').glob('*.md'))]:
        if not doc.exists():
            continue
        for target in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)', doc.read_text(encoding='utf-8')):
            target = target.split('#', 1)[0].strip()
            if not target or target.startswith(('http://', 'https://', 'mailto:', '#')) or '<' in target:
                continue
            if not (doc.parent / target).exists():
                problems.append(f'Link Markdown inexistente: {doc.relative_to(ROOT)} -> {target}')
    for name in EXPECTED:
        if not (ROOT / name).is_file():
            problems.append(f'Arquivo obrigatório ausente: {name}')
    # The public source archive must not include the original reference design boards,
    # which may contain art whose redistributable license has not been verified.
    if (ROOT / 'insightlab_mvp/assets/brand-kit').exists():
        problems.append('Arquivos de referência do brand kit encontrados: rever direitos de redistribuição')
    if problems:
        print(f'FALHA: {len(problems)} problema(s) na árvore pública:', file=sys.stderr)
        for issue in problems:
            print('  - ' + issue, file=sys.stderr)
        return 1
    print(f'OK: {checked} arquivos de texto inspecionados; {len(files)} arquivos no pacote, sem padrões de segredos óbvios.')
    print('Limitação: não verifica histórico do Git, credenciais obfuscadas ou conteúdo de imagens; faça também uma revisão manual.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
