import { beforeEach, describe, expect, it } from 'vitest';
import { runSeoChecks } from '../../src/features/seo/checks';

describe('SEO checks', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('lang');
  });

  it('fails when title is missing', () => {
    const results = runSeoChecks();
    const title = results.find((r) => r.id === 'title');
    expect(title?.status).toBe('fail');
  });

  it('passes when title within limit', () => {
    document.title = 'Hello World';
    const results = runSeoChecks();
    const title = results.find((r) => r.id === 'title');
    expect(title?.status).toBe('pass');
  });

  it('warns when title too long', () => {
    document.title = 'a'.repeat(80);
    const results = runSeoChecks();
    const title = results.find((r) => r.id === 'title');
    expect(title?.status).toBe('warn');
  });

  it('detects multiple H1s', () => {
    document.body.innerHTML = '<h1>One</h1><h1>Two</h1>';
    const results = runSeoChecks();
    const h1 = results.find((r) => r.id === 'h1');
    expect(h1?.status).toBe('warn');
  });

  it('flags images without alt', () => {
    document.body.innerHTML = '<img src="a.jpg"><img src="b.jpg" alt="">';
    const results = runSeoChecks();
    const alt = results.find((r) => r.id === 'alt');
    expect(alt?.status).toBe('fail');
  });

  it('warns when canonical missing', () => {
    const results = runSeoChecks();
    const canon = results.find((r) => r.id === 'canonical');
    expect(canon?.status).toBe('warn');
  });

  it('passes html lang when set', () => {
    document.documentElement.setAttribute('lang', 'pt-BR');
    const results = runSeoChecks();
    const lang = results.find((r) => r.id === 'html-lang');
    expect(lang?.status).toBe('pass');
    expect(lang?.value).toBe('pt-BR');
  });
});
