# Fábrica de Cursos v1 - Landing Page

Landing page para upload de imagem + áudio que gera vídeos com Avatar IV da HeyGen.

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure a API key do HeyGen:
```bash
cp .env.example .env
# Edite o arquivo .env e adicione sua HEYGEN_API_KEY
```

3. Execute o servidor:
```bash
npm start
```

4. Acesse: http://localhost:3000

## Como Usar

1. Faça upload de uma imagem (1080x1920, formato .jpg ou .png)
2. Faça upload de um áudio (.mp3 ou .wav)
3. Clique em "Gerar Vídeo"
4. Aguarde a resposta da API do HeyGen

## Estrutura da API

- **POST /api/generate-video**: Recebe imagem e áudio, envia para HeyGen e retorna resposta

## Requisitos

- Node.js 18+
- API Key do HeyGen (plano Pro ou Scale para Avatar IV)
