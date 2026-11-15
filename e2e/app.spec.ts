import { expect, test } from '@playwright/test';
import { forecastFixture, geocodingFixture } from '../tests/fixtures';

test.beforeEach(async ({ page }) => {
  await page.route('**/v1/forecast?**', (route) => route.fulfill({ json: forecastFixture() }));
  await page.route('**/v1/search?**', (route) => {
    const query = new URL(route.request().url()).searchParams.get('name');
    return route.fulfill({ json: query === 'Atlantisxyz' ? {} : geocodingFixture });
  });
});

test('navega pelas quatro telas sem erros de execução', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByTestId('current-temperature')).toHaveText('23°');
  await page.getByRole('tab', { name: 'Previsão', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Os próximos dias.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver detalhes de Amanhã' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver detalhes de Amanhã' }).click();
  await expect(page.getByText('Amanhã, em detalhes', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Cidades', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nome da cidade' })).toBeVisible();
  await page.getByRole('tab', { name: 'Ajustes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pequenos ajustes.' })).toBeVisible();
  await page.getByRole('button', { name: 'Sobre o Brisa', exact: true }).click();
  await expect(page.getByText('Guilherme Bueno Reis', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar aos ajustes', exact: true }).click();
  await page.getByRole('tab', { name: 'Hoje', exact: true }).click();
  await expect(page.getByTestId('current-weather-card')).toBeVisible();
  expect(errors).toEqual([]);
});

test('valida entradas vazias, curtas e sem letras', async ({ page }) => {
  await page.goto('/cities');
  await page.getByRole('button', { name: 'Buscar cidade', exact: true }).click();
  await expect(page.getByText('Digite pelo menos 2 letras para buscar uma cidade.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Nome da cidade' }).fill('123');
  await page.getByRole('button', { name: 'Buscar cidade', exact: true }).click();
  await expect(page.getByText('Digite o nome de uma cidade usando letras.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Nome da cidade' }).fill('a');
  await page.getByRole('textbox', { name: 'Nome da cidade' }).press('Enter');
  await expect(page.getByText('Digite pelo menos 2 letras para buscar uma cidade.')).toBeVisible();
});

test('busca, salva e abre uma cidade; mantém a seleção após reiniciar', async ({ page }) => {
  await page.goto('/cities');
  await page.getByRole('textbox', { name: 'Nome da cidade' }).fill('Curitiba');
  await page.getByRole('button', { name: 'Buscar cidade', exact: true }).click();
  await expect(page.getByText('Resultado da busca', { exact: true })).toBeVisible();
  await page
    .getByTestId('city-card-3464975')
    .getByRole('button', { name: 'Salvar Curitiba nos favoritos', exact: true })
    .click();
  await page
    .getByTestId('city-card-3464975')
    .getByRole('button', { name: 'Ver clima de Curitiba', exact: true })
    .click();
  await expect(page.getByTestId('current-weather-card')).toContainText('Curitiba');
  await expect(page.getByTestId('current-temperature')).toHaveText('23°');
  await page.reload();
  await expect(page.getByTestId('current-weather-card')).toContainText('Curitiba');
  await page.getByRole('tab', { name: 'Cidades', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Remover Curitiba dos favoritos', exact: true }),
  ).toBeVisible();
});

test('mostra estado vazio para uma busca sem resultados e permite limpar', async ({ page }) => {
  await page.goto('/cities');
  await page.getByRole('textbox', { name: 'Nome da cidade' }).fill('Atlantisxyz');
  await page.getByRole('button', { name: 'Buscar cidade', exact: true }).click();
  await expect(page.getByText('Nenhuma cidade por aqui.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar busca', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nome da cidade' })).toHaveValue('');
  await expect(page.getByText('Cidades salvas', { exact: true })).toBeVisible();
});

test('remove o último favorito sem apagar a cidade em consulta', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('current-temperature')).toHaveText('23°');
  await page.getByRole('tab', { name: 'Cidades', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seus lugares.' })).toBeVisible();
  await page
    .getByTestId('cities-list')
    .getByRole('button', { name: 'Remover Guarapuava dos favoritos', exact: true })
    .click();
  await expect(page.getByText('Seu próximo lugar está lá fora.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('0/12', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Hoje', exact: true }).click();
  await expect(page.getByTestId('current-weather-card')).toContainText('Guarapuava');
});

test('converte unidades, persiste escolhas e restaura os padrões', async ({ page }) => {
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'Fahrenheit · °F', exact: true }).click();
  await page.getByRole('radio', { name: 'm/s', exact: true }).click();
  await page.getByRole('tab', { name: 'Hoje', exact: true }).click();
  await expect(page.getByTestId('current-temperature')).toHaveText('73°');
  await expect(page.getByText('3,3 m/s', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('current-temperature')).toHaveText('73°');
  await page.getByRole('tab', { name: 'Ajustes', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Fahrenheit · °F', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Restaurar unidades padrão', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Celsius · °C', exact: true })).toBeChecked();
  await page.getByRole('tab', { name: 'Hoje', exact: true }).click();
  await expect(page.getByTestId('current-temperature')).toHaveText('23°');
});

test('exibe falha inicial e recupera após tentar novamente', async ({ page }) => {
  await page.route('**/v1/forecast?**', (route) => route.fulfill({ status: 503, json: {} }));
  await page.goto('/');
  await expect(page.getByText('O tempo não carregou.', { exact: true })).toBeVisible();
  await page.route('**/v1/forecast?**', (route) => route.fulfill({ json: forecastFixture() }));
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.getByTestId('current-temperature')).toHaveText('23°');
});

test('preserva a consulta em cache quando a conexão falha', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('current-temperature')).toHaveText('23°');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('@brisa/weather-v1')))
    .toBeTruthy();
  await page.route('**/v1/forecast?**', (route) => route.abort('internetdisconnected'));
  await page.reload();
  await expect(page.getByTestId('current-temperature')).toHaveText('23°');
  await expect(page.getByText(/Mostrando a última consulta salva/)).toBeVisible();
});

test('informa falha na busca e permite uma nova tentativa', async ({ page }) => {
  await page.route('**/v1/search?**', (route) => route.fulfill({ status: 429, json: {} }));
  await page.goto('/cities');
  await page.getByRole('textbox', { name: 'Nome da cidade' }).fill('Curitiba');
  await page.getByRole('button', { name: 'Buscar cidade', exact: true }).click();
  await expect(page.getByText(/Muitas consultas por agora/)).toBeVisible();
  await page.route('**/v1/search?**', (route) => route.fulfill({ json: geocodingFixture }));
  await page.getByRole('button', { name: 'Buscar cidade', exact: true }).click();
  await expect(
    page
      .getByTestId('city-card-3464975')
      .getByRole('button', { name: 'Ver clima de Curitiba', exact: true }),
  ).toBeVisible();
});

test('continua utilizável quando o usuário nega a localização', async ({ page, context }) => {
  await context.clearPermissions();
  await page.goto('/cities');
  await page.getByRole('button', { name: 'Usar minha localização', exact: true }).click();
  await expect(
    page.getByText('Localização não autorizada. Você pode buscar uma cidade pelo nome.'),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Nome da cidade' })).toBeVisible();
});

test('consulta as coordenadas do GPS autorizado', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -25.4278, longitude: -49.2731 });
  let latitude = '';
  await page.route('**/v1/forecast?**', (route) => {
    latitude = new URL(route.request().url()).searchParams.get('latitude') ?? '';
    return route.fulfill({ json: forecastFixture() });
  });
  await page.goto('/cities');
  await page.getByRole('button', { name: 'Usar minha localização', exact: true }).click();
  await expect(page.getByTestId('current-weather-card')).toContainText('Minha localização');
  await expect.poll(() => latitude).toBe('-25.428');
});

test('recupera dados locais corrompidos e mantém a navegação', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('@brisa/state-v1', '{invalid');
    localStorage.setItem('@brisa/weather-v1', '{invalid');
  });
  await page.goto('/');
  await expect(page.getByTestId('current-temperature')).toHaveText('23°');
  await expect(page.getByTestId('current-weather-card')).toContainText('Guarapuava');
});

test('mantém a tela dentro da largura disponível em um celular pequeno', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/');
  await expect(page.getByTestId('current-weather-card')).toBeVisible();
  for (const name of ['Previsão', 'Cidades', 'Ajustes', 'Hoje']) {
    await page.getByRole('tab', { name, exact: true }).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  }
});
