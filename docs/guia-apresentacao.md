# Guia para apresentar o Brisa

## Demonstração em cerca de dois minutos

1. Abra **Hoje** e apresente a cidade, temperatura, sensação térmica e previsão por hora. Role para mostrar os quatro indicadores e os horários do sol.
2. Entre em **Previsão**, toque em **Amanhã** e role até os detalhes desse dia.
3. Em **Cidades**, tente buscar sem digitar nada para mostrar a validação. Depois busque Curitiba, salve pelo coração e abra a cidade.
4. Vá a **Ajustes**, altere para Fahrenheit e retorne à tela Hoje para mostrar a conversão. Restaure as unidades padrão.
5. Feche e abra o app para mostrar que cidade, favoritos e unidades permanecem salvos.
6. Se desejar demonstrar o GPS, solicite a localização. Se negar a permissão, mostre que a busca continua disponível.

## O que entender no código

| Conceito | Onde observar | Explicação |
| --- | --- | --- |
| Componentes e props | `src/components/weather-cards.tsx` | `MetricCard` recebe título, valor, detalhe e ícone. O mesmo componente apresenta chuva, vento, umidade e UV. |
| Estado local | `src/app/cities.tsx` | `query`, `results`, `searching` e `inputError` mudam conforme a digitação e a resposta da busca. |
| Estado compartilhado | `src/context/weather-context.tsx` | O contexto disponibiliza a cidade selecionada, favoritos, unidades, cache e ações para as quatro telas. |
| Efeitos | `src/context/weather-context.tsx` | Um efeito lê o AsyncStorage ao iniciar. Outros salvam alterações e consultam a API quando a cidade muda. |
| Navegação | `src/app/_layout.tsx` | O `Tabs` do Expo Router registra as quatro telas. Os nomes dos arquivos definem as rotas. |
| Listagem | `src/app/forecast.tsx` | `FlatList` recebe os dias, uma chave estável e uma função para renderizar cada linha. |
| Formulário | `src/app/cities.tsx` | `TextInput` atualiza `query`. A submissão valida antes de consultar a API. |
| Requisição HTTP | `src/services/api.ts` | `fetch` consulta a Open-Meteo. A resposta é validada e convertida em objetos usados pelo app. |
| Persistência | `src/services/storage.ts` | Objetos são convertidos em JSON para salvar e validados ao recuperar. Dados corrompidos voltam ao estado inicial. |
| Estilos | `src/theme.ts` e `StyleSheet` dos componentes | Cores e fontes compartilhadas mantêm a identidade visual. Os estilos ficam separados da renderização. |

## Caminho de uma busca

O usuário digita uma cidade. `setQuery` atualiza o texto. Ao enviar, `validateCityQuery` remove espaços extras e valida a entrada. `searchCities` consulta a API de geocodificação e retorna nome, região e coordenadas. Ao tocar no resultado, `selectCity` muda a cidade do contexto. Essa mudança dispara o efeito que chama `fetchWeather`. A resposta atualiza o cache, e as telas renderizam os novos valores.

## Perguntas que podem aparecer

**Por que Context?** A cidade e as unidades precisam ser compartilhadas entre telas. O contexto evita passar os mesmos dados manualmente por vários componentes.

**Por que salvar JSON?** O AsyncStorage armazena strings. `JSON.stringify` transforma o objeto em texto; `JSON.parse` faz a operação inversa.

**Por que validar a resposta da API?** TypeScript verifica o código durante o desenvolvimento, mas não garante que os dados recebidos pela internet tenham o formato esperado. Os schemas do Zod fazem essa verificação durante a execução.

**Como a conversão funciona?** A API sempre retorna Celsius e km/h. A tela converte Celsius usando `C × 1,8 + 32` e km/h para m/s dividindo por `3,6`. Mudar as unidades não dispara outra consulta.

**Por que AbortController?** Se o usuário trocar de cidade ou alterar a busca antes de a consulta terminar, a requisição anterior é cancelada para evitar mostrar um resultado antigo.

**Como funciona sem internet?** Uma previsão já consultada fica no cache. Se a atualização falhar, ela continua visível com um aviso. Não é possível buscar uma cidade nova sem conexão.

**Os horários são do celular?** São formatados no fuso da cidade consultada. A API retorna os instantes em segundos Unix e informa o fuso correspondente.

**O que os testes comprovam?** Os testes unitários verificam regras isoladas. Os testes de interface usam a versão web para verificar navegação, formulário, persistência, erros e localização. Exportar os pacotes nativos verifica a compilação do código para Android e iOS; executar em um aparelho verifica o comportamento nativo real.

## Conferência no Expo Go antes da entrega

- Abrir pelo QR Code, sem erro de versão ou tela vermelha.
- Alternar entre as quatro abas.
- Buscar uma cidade, salvá-la e removê-la.
- Alterar as unidades e reiniciar o app.
- Permitir e negar a localização.
- Consultar uma previsão, desligar a internet e tentar atualizar.
- Rolar as listas e conferir a tela com o teclado aberto.
- Confirmar que o vídeo e as capturas estão no repositório público.
