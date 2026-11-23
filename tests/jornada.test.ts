import { describe, it, expect } from 'vitest';
import { diagnosticar, type Equipo } from '../src/lib/diagnostico';
import { aCSV, cargar, crearRegistro, guardar, indicadores, type Registro } from '../src/lib/jornada';

const reg = (p: Partial<Registro>): Registro => ({
  n: 1, tipo: 'portatil', procesador: 'Intel 1.ª–7.ª', ramGB: 8, veredicto: 'linux', kgRaee: 2.5, ...p,
});

describe('indicadores', () => {
  it('jornada vacía da 0 y no NaN', () => {
    expect(indicadores([])).toEqual({ recibidos: 0, recuperados: 0, porcentaje: 0, kgEvitados: 0, metaCumplida: false });
  });
  it('calcula recuperación y kg', () => {
    const r = indicadores([
      reg({ n: 1 }),
      reg({ n: 2, veredicto: 'reciclaje', kgRaee: 0 }),
      reg({ n: 3, veredicto: 'mejora', tipo: 'torre', kgRaee: 8 }),
    ]);
    expect(r).toEqual({ recibidos: 3, recuperados: 2, porcentaje: 67, kgEvitados: 10.5, metaCumplida: true });
  });
});

describe('aCSV', () => {
  it('vacío = solo encabezado con BOM', () => {
    expect(aCSV([])).toBe('﻿n;tipo;procesador;ram_gb;veredicto;kg_raee_evitados');
  });
  it('decimal con coma', () => {
    const lineas = aCSV([reg({})]).split('\r\n');
    expect(lineas).toHaveLength(2);
    expect(lineas[1].endsWith(';2,5')).toBe(true);
  });
});

describe('cargar / guardar', () => {
  it('nunca lanza', () => {
    expect(cargar({ getItem: () => { throw new Error('bloqueado'); } })).toEqual([]);
    expect(cargar({ getItem: () => '{no json' })).toEqual([]);
    expect(cargar({ getItem: () => '{"a":1}' })).toEqual([]);
    expect(cargar(null)).toEqual([]);
    expect(guardar([], { setItem: () => { throw new Error('lleno'); } })).toBe(false);
  });
  it('ida y vuelta', () => {
    const mem: Record<string, string> = {};
    const s = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } };
    expect(guardar([reg({})], s)).toBe(true);
    expect(cargar(s)).toEqual([reg({})]);
  });
});

describe('crearRegistro', () => {
  it('etiqueta AMD Ryzen 1000', () => {
    const e: Equipo = { tipo: 'torre', procesador: 'amd', familiaAmd: 'ryzen1000', ramGB: 8, disco: 'ssd', discoGB: 256, tpm: 'si', arranqueSeguro: 'si' };
    const r = crearRegistro(e, diagnosticar(e), 4);
    expect(r).toEqual({ n: 4, tipo: 'torre', procesador: 'AMD Ryzen 1000', ramGB: 8, veredicto: 'linux', kgRaee: 8 });
  });
});
