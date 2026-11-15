# Publicação no GitHub

O pacote completo inclui o histórico Git local, com commits nas datas reais de desenvolvimento.

Se estiver partindo do ZIP, extraia o projeto e abra um terminal dentro da pasta `brisa`. Com o GitHub CLI instalado, autentique sua conta e crie o repositório privado:

```bash
gh auth login
gh repo create brisa-clima --private --source=. --remote=origin --push
```

Se o repositório já tiver sido criado, configure a URL exibida pelo próprio GitHub como `origin` e envie a branch `main`.

Para a entrega, altere a visibilidade para **Public** em **Settings → General → Danger Zone → Change repository visibility**. Depois abra o link em uma janela anônima e confira os arquivos, imagens e vídeo. Envie esse link público ao Moodle.

Para executar o projeto após extrair o ZIP:

```bash
pnpm install --frozen-lockfile
pnpm start
```
