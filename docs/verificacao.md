# Verificação do Brisa

Data: 15/11/2026.

## Resultados

| Verificação | Resultado |
| --- | --- |
| TypeScript em modo estrito | Sem erros. |
| Biome, regras recomendadas e formatação | Sem erros ou regras desativadas para ocultar problemas. |
| Testes unitários com Vitest | 70 testes aprovados. |
| Testes de interface com Playwright | 26 execuções aprovadas: 13 cenários em celular e em desktop. |
| Dependências do Expo | `expo install --check` sem incompatibilidades. |
| Expo Doctor | 20 de 20 verificações aprovadas. |
| Exportação web | Pacote gerado pelo Metro. |
| Exportação Android | Pacote Hermes gerado pelo Metro. |
| Exportação iOS | Pacote Hermes gerado pelo Metro. |
| Consulta real à Open-Meteo | Resposta válida para Guarapuava; capturas obtidas com a consulta real. |

## Cenários de interface

1. Navegação entre as quatro telas, detalhes do dia e modal Sobre, sem erros de JavaScript.
2. Entrada vazia, curta ou sem letras no formulário.
3. Busca, favorito, seleção de cidade e reinício do app.
4. Busca sem resultados e limpeza do campo.
5. Remoção do último favorito, preservando a cidade em consulta.
6. Conversão de temperatura e vento, persistência e restauração dos padrões.
7. Falha inicial da API e recuperação pelo botão Tentar novamente.
8. Exibição da previsão salva após falha de conexão.
9. Limite de requisições da busca e nova tentativa.
10. Localização negada, mantendo a busca manual disponível.
11. Localização autorizada e consulta das coordenadas arredondadas.
12. Dados locais corrompidos e recuperação do estado inicial.
13. Navegação em uma janela de 320 px sem rolagem horizontal da página.

## O que foi testado separadamente

Os testes unitários cobrem conversões, direções do vento, condições meteorológicas WMO, fusos, nomes de dias, faixas de UV, validação de texto, resposta da API, dados nulos, falhas HTTP, timeout, cancelamento, JSON corrompido e limite do cache.

Os testes de interface usam respostas controladas, sem depender da disponibilidade da API. As capturas e a demonstração consultam dados reais. A localização dos testes web é simulada pelas permissões e coordenadas do navegador.

## Ambiente e limites

As verificações foram realizadas em Linux com Node.js 24.22.1, pnpm 11.25.0 e Chromium 156. As interfaces foram verificadas em formato de celular e desktop na versão Expo Web.

Android e iOS foram verificados por exportação dos pacotes nativos. Não havia aparelho físico, emulador Android ou simulador iOS disponível neste ambiente. A execução real no Expo Go e o GPS nativo devem ser conferidos em um dispositivo antes da entrega. O passo a passo está no guia de apresentação.

As previsões dependem da disponibilidade e dos limites da Open-Meteo. Sem internet, apenas dados já consultados podem ser exibidos. O cache do navegador não transforma a versão web em um aplicativo instalável offline.
