import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const server = spawn(process.execPath, ['scripts/serve-web.mjs'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
const directory = await mkdtemp(resolve(tmpdir(), 'brisa-demo-'));
const frames = [];
let browser;

try {
  await once(server.stdout, 'data');
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.route('https://**.open-meteo.com/**', async (route) => {
    try {
      const response = await fetch(route.request().url());
      await route.fulfill({
        status: response.status,
        contentType: 'application/json',
        body: await response.text(),
      });
    } catch {
      await route.abort();
    }
  });
  await page.goto('http://127.0.0.1:8081');
  await page.getByTestId('current-weather-card').waitFor({ timeout: 25000 });
  const client = await page.context().newCDPSession(page);
  client.on('Page.screencastFrame', (event) => {
    const file = resolve(directory, `frame-${String(frames.length).padStart(5, '0')}.jpg`);
    writeFileSync(file, Buffer.from(event.data, 'base64'));
    frames.push({ file, time: event.metadata.timestamp });
    void client
      .send('Page.screencastFrameAck', { sessionId: event.sessionId })
      .catch(() => undefined);
  });
  await client.send('Page.startScreencast', {
    format: 'jpeg',
    quality: 90,
    maxWidth: 780,
    maxHeight: 1688,
    everyNthFrame: 1,
  });

  await page.waitForTimeout(2500);
  await page.getByText('Um olhar nos detalhes', { exact: true }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  await page.getByText('Do nascer ao pôr do sol', { exact: true }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  await page.getByRole('tab', { name: 'Previsão', exact: true }).click();
  await page.getByRole('heading', { name: 'Os próximos dias.' }).waitFor();
  await page.waitForTimeout(2200);
  await page.getByRole('button', { name: 'Ver detalhes de Amanhã' }).click();
  await page.getByTestId('forecast-details').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  await page.getByRole('tab', { name: 'Cidades', exact: true }).click();
  await page.getByRole('heading', { name: 'Seus lugares.' }).waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Buscar cidade', exact: true }).click();
  await page.waitForTimeout(2000);
  await page
    .getByRole('textbox', { name: 'Nome da cidade' })
    .pressSequentially('Curitiba', { delay: 130 });
  await page.getByRole('button', { name: 'Buscar cidade', exact: true }).click();
  await page
    .getByTestId('city-card-3464975')
    .getByRole('button', { name: 'Ver clima de Curitiba', exact: true })
    .waitFor({ timeout: 20000 });
  await page.waitForTimeout(1800);
  await page
    .getByTestId('city-card-3464975')
    .getByRole('button', { name: 'Salvar Curitiba nos favoritos', exact: true })
    .click();
  await page.waitForTimeout(1300);
  await page
    .getByTestId('city-card-3464975')
    .getByRole('button', { name: 'Ver clima de Curitiba', exact: true })
    .click();
  await page.getByTestId('current-weather-card').waitFor({ timeout: 20000 });
  await page.waitForTimeout(2500);
  await page.getByRole('tab', { name: 'Ajustes', exact: true }).click();
  await page.getByRole('heading', { name: 'Pequenos ajustes.' }).waitFor();
  await page.waitForTimeout(2000);
  await page.getByRole('radio', { name: 'Fahrenheit · °F', exact: true }).click();
  await page.waitForTimeout(1500);
  await page.getByRole('radio', { name: 'm/s', exact: true }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('tab', { name: 'Hoje', exact: true }).click();
  await page.getByTestId('current-weather-card').waitFor();
  await page.waitForTimeout(2500);
  await page.reload();
  await page.getByTestId('current-weather-card').waitFor();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Cidades', exact: true }).click();
  await page.getByRole('heading', { name: 'Seus lugares.' }).waitFor();
  await page.waitForTimeout(2000);
  await page.getByRole('tab', { name: 'Ajustes', exact: true }).click();
  await page.getByRole('button', { name: 'Restaurar unidades padrão', exact: true }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('tab', { name: 'Hoje', exact: true }).click();
  await page.getByTestId('current-weather-card').waitFor();
  await page.waitForTimeout(2500);
  await client.send('Page.stopScreencast');

  const last = frames.at(-1);
  if (!last) throw new Error('Nenhum quadro foi capturado.');
  let concat = 'ffconcat version 1.0\n';
  frames.forEach((frame, index) => {
    const duration = frames[index + 1] ? Math.max(0.04, frames[index + 1].time - frame.time) : 2;
    concat += `file '${frame.file}'\nduration ${duration}\n`;
  });
  concat += `file '${last.file}'\n`;
  const input = resolve(directory, 'frames.ffconcat');
  await writeFile(input, concat);
  await mkdir('docs', { recursive: true });
  const encoder = spawn(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      input,
      '-vf',
      'fps=24,scale=780:1688:flags=lanczos,format=yuv420p',
      '-c:v',
      'libx264',
      '-crf',
      '22',
      '-preset',
      'medium',
      '-movflags',
      '+faststart',
      'docs/brisa-demonstracao.mp4',
    ],
    { stdio: 'inherit' },
  );
  const [exitCode] = await once(encoder, 'exit');
  if (exitCode !== 0) throw new Error('Falha ao gerar o vídeo.');
  process.stdout.write(
    `Demonstração salva: docs/brisa-demonstracao.mp4 (${frames.length} quadros de origem)\n`,
  );
} finally {
  await browser?.close();
  server.kill();
}
