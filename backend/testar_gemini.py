"""Teste Gemini isolado. A chave não é gravada no disco."""
import getpass
from google import genai
key = getpass.getpass('Cole sua API key Gemini: ').strip()
client = genai.Client(api_key=key)
try:
    candidates = []
    for m in client.models.list():
        actions = getattr(m, 'supported_actions', None) or getattr(m, 'supported_generation_methods', None) or []
        if 'generateContent' in actions:
            candidates.append(m.name)
    print('Modelos com generateContent (até 25):')
    print('\n'.join(candidates[:25]) or 'Nenhum modelo listado com este atributo; confira no AI Studio.')
    model = input('Modelo para testar [gemini-2.5-flash]: ').strip() or 'gemini-2.5-flash'
    answer = client.models.generate_content(model=model, contents='Responda apenas OK')
    print('Resposta:', answer.text)
except Exception as exc:
    print('Tipo:', type(exc).__name__)
    print('Detalhes:', str(exc).replace(key,'[CHAVE_OCULTA]'))
    raise SystemExit(1)
