import type { Diagnostico, Equipo, TipoEquipo, VeredictoId } from './diagnostico';

export interface Registro {
  n: number;
  tipo: TipoEquipo;
  procesador: string;
  ramGB: number;
  veredicto: VeredictoId;
  kgRaee: number;
}

export const META_RECUPERACION = 60;
export const CLAVE_STORAGE = 'segunda-vida:jornada';

export const ETIQUETA_TIPO: Record<TipoEquipo, string> = {
  portatil: 'Portátil',
  torre: 'Torre',
  todoenuno: 'Todo en uno',
};

export const ETIQUETA_VEREDICTO: Record<VeredictoId, string> = {
  actualizar: 'Actualizar',
  linux: 'Linux',
  mejora: 'Linux + mejora',
  reciclaje: 'Reciclaje',
};

function etiquetaProcesador(e: Equipo): string {
  if (e.procesador === 'intel') return e.genIntel === '8plus' ? 'Intel 8.ª gen+' : 'Intel 1.ª–7.ª';
  if (e.procesador === 'amd') {
    if (e.familiaAmd === 'ryzen2000plus') return 'AMD Ryzen 2000+';
    if (e.familiaAmd === 'ryzen1000') return 'AMD Ryzen 1000';
    return 'AMD pre-Ryzen';
  }
  return 'Otro / no sé';
}

export function crearRegistro(e: Equipo, d: Diagnostico, n: number): Registro {
  return {
    n,
    tipo: e.tipo,
    procesador: etiquetaProcesador(e),
    ramGB: e.ramGB,
    veredicto: d.veredicto,
    kgRaee: d.impacto?.kgRaee ?? 0,
  };
}

export function indicadores(r: Registro[]) {
  const recibidos = r.length;
  const recuperados = r.filter(x => x.veredicto !== 'reciclaje').length;
  const porcentaje = recibidos ? Math.round((recuperados / recibidos) * 100) : 0;
  const kgEvitados = Math.round(r.reduce((s, x) => s + x.kgRaee, 0) * 10) / 10;
  return { recibidos, recuperados, porcentaje, kgEvitados, metaCumplida: recibidos > 0 && porcentaje >= META_RECUPERACION };
}

const celda = (v: string | number) => {
  const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function aCSV(r: Registro[]): string {
  const filas = [
    'n;tipo;procesador;ram_gb;veredicto;kg_raee_evitados',
    ...r.map(x =>
      [x.n, ETIQUETA_TIPO[x.tipo], x.procesador, x.ramGB, ETIQUETA_VEREDICTO[x.veredicto], x.kgRaee].map(celda).join(';'),
    ),
  ];
  return '﻿' + filas.join('\r\n');
}

function storagePorDefecto(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function cargar(storage: Pick<Storage, 'getItem'> | null = storagePorDefecto()): Registro[] {
  try {
    if (!storage) return [];
    const datos = JSON.parse(storage.getItem(CLAVE_STORAGE) ?? '[]');
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

export function guardar(r: Registro[], storage: Pick<Storage, 'setItem'> | null = storagePorDefecto()): boolean {
  try {
    if (!storage) return false;
    storage.setItem(CLAVE_STORAGE, JSON.stringify(r));
    return true;
  } catch {
    return false;
  }
}
