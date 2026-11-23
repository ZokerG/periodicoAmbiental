import { describe, it, expect } from 'vitest';
import { diagnosticar, urlPublica, type Equipo } from '../src/lib/diagnostico';

const base: Equipo = {
  tipo: 'portatil', procesador: 'intel', genIntel: '8plus', ramGB: 8,
  disco: 'ssd', discoGB: 256, tpm: 'si', arranqueSeguro: 'si',
};
const d = (p: Partial<Equipo>) => diagnosticar({ ...base, ...p });

describe('diagnosticar', () => {
  it('equipo compatible → actualizar', () => {
    const r = d({});
    expect(r.compatibleW11).toBe(true);
    expect(r.motivos).toEqual([]);
    expect(r.veredicto).toBe('actualizar');
    expect(r.titulo).toBe('No lo deseche: actualícelo');
    expect(r.recomendacion).toBe('Actualizar gratis a Windows 11.');
    expect(r.impacto).toEqual({ kgRaee: 2.5, kgCo2: 250 });
  });

  it('Intel 7.ª → linux Cinnamon con motivo de procesador', () => {
    const r = d({ genIntel: 'pre8' });
    expect(r.motivos).toContain('Tu procesador no está en la lista de Microsoft.');
    expect(r.veredicto).toBe('linux');
    expect(r.recomendacion).toBe('Linux Mint Cinnamon o Ubuntu LTS.');
  });

  it('Ryzen 1000 es incompatible', () => {
    expect(d({ procesador: 'amd', familiaAmd: 'ryzen1000', genIntel: undefined }).compatibleW11).toBe(false);
  });

  it('Ryzen 2000+ es compatible', () => {
    expect(d({ procesador: 'amd', familiaAmd: 'ryzen2000plus', genIntel: undefined }).compatibleW11).toBe(true);
  });

  it('AMD ignora genIntel sobrante', () => {
    expect(d({ procesador: 'amd', genIntel: '8plus', familiaAmd: 'preryzen' }).compatibleW11).toBe(false);
  });

  it('TPM "no sé" no se puede confirmar', () => {
    expect(d({ tpm: 'nose' }).motivos).toContain('No se pudo confirmar que tenga TPM 2.0.');
    expect(d({ tpm: 'no' }).motivos).toContain('No tiene TPM 2.0.');
  });

  it('arranque seguro', () => {
    expect(d({ arranqueSeguro: 'no' }).motivos).toContain('No tiene arranque seguro (UEFI).');
    expect(d({ arranqueSeguro: 'nose' }).motivos).toContain('No se pudo confirmar el arranque seguro (UEFI).');
  });

  it('veredictos por RAM', () => {
    expect(d({ genIntel: 'pre8', ramGB: 6 }).recomendacion).toBe('Linux Mint XFCE.');
    expect(d({ genIntel: 'pre8', ramGB: 4 }).recomendacion).toBe('Linux Mint XFCE.');
    expect(d({ ramGB: 3 }).veredicto).toBe('mejora');
    expect(d({ ramGB: 2 }).veredicto).toBe('mejora');
    expect(d({ ramGB: 2 }).recomendacion).toBe('Lubuntu o Xubuntu LTS; ampliar a 4 GB si es posible.');
    const r1 = d({ ramGB: 1 });
    expect(r1.veredicto).toBe('reciclaje');
    expect(r1.impacto).toBeNull();
  });

  it('procesador "otro" → reciclaje', () => {
    const r = d({ procesador: 'otro', genIntel: undefined, ramGB: 16 });
    expect(r.veredicto).toBe('reciclaje');
    expect(r.titulo).toBe('Reciclaje responsable');
    expect(r.motivos).toContain('No se pudo confirmar que tu procesador esté en la lista de Microsoft.');
  });

  it('mejora SSD', () => {
    expect(d({ disco: 'hdd', genIntel: 'pre8' }).mejoraSSD).toBe(true);
    expect(d({ disco: 'hdd', ramGB: 1 }).mejoraSSD).toBe(false);
    expect(d({ disco: 'hdd' }).mejoraSSD).toBe(true);
    expect(d({}).mejoraSSD).toBe(false);
  });

  it('motivos de RAM y disco', () => {
    expect(d({ discoGB: 32 }).motivos).toContain('El disco tiene menos de 64 GB.');
    expect(d({ ramGB: 3 }).motivos).toContain('Tiene menos de 4 GB de RAM.');
  });

  it('impacto por tipo', () => {
    expect(d({ tipo: 'torre' }).impacto).toEqual({ kgRaee: 8, kgCo2: 300 });
    expect(d({ tipo: 'todoenuno' }).impacto).toEqual({ kgRaee: 9, kgCo2: 400 });
  });
});

describe('urlPublica', () => {
  it('une origin y base sin barras dobles', () => {
    expect(urlPublica('https://u.github.io', '/repo/')).toBe('https://u.github.io/repo/');
    expect(urlPublica('https://x.pages.dev', '/')).toBe('https://x.pages.dev/');
    expect(urlPublica('https://u.github.io', '/repo')).toBe('https://u.github.io/repo/');
  });
});
