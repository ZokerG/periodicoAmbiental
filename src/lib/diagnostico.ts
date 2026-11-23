export type TipoEquipo = 'portatil' | 'torre' | 'todoenuno';
export type Procesador = 'intel' | 'amd' | 'otro';
export type GenIntel = 'pre8' | '8plus';
export type FamiliaAmd = 'preryzen' | 'ryzen1000' | 'ryzen2000plus';
export type TriEstado = 'si' | 'no' | 'nose';
export type VeredictoId = 'actualizar' | 'linux' | 'mejora' | 'reciclaje';

export interface Equipo {
  tipo: TipoEquipo;
  procesador: Procesador;
  genIntel?: GenIntel;
  familiaAmd?: FamiliaAmd;
  ramGB: number; // 16 = "16 o más"
  disco: 'hdd' | 'ssd';
  discoGB: number;
  tpm: TriEstado;
  arranqueSeguro: TriEstado;
}

export interface Diagnostico {
  compatibleW11: boolean;
  motivos: string[];
  veredicto: VeredictoId;
  titulo: string;
  recomendacion: string;
  mejoraSSD: boolean;
  impacto: { kgRaee: number; kgCo2: number } | null;
}

/** Estimaciones orientativas por tipo de equipo. */
export const IMPACTO: Record<TipoEquipo, { kgRaee: number; kgCo2: number }> = {
  portatil: { kgRaee: 2.5, kgCo2: 250 },
  torre: { kgRaee: 8, kgCo2: 300 },
  todoenuno: { kgRaee: 9, kgCo2: 400 },
};

function cpuCompatible(e: Equipo): boolean {
  if (e.procesador === 'intel') return e.genIntel === '8plus';
  if (e.procesador === 'amd') return e.familiaAmd === 'ryzen2000plus';
  return false;
}

export function evaluarW11(e: Equipo): { compatible: boolean; motivos: string[] } {
  const motivos: string[] = [];
  if (!cpuCompatible(e)) {
    motivos.push(
      e.procesador === 'otro'
        ? 'No se pudo confirmar que tu procesador esté en la lista de Microsoft.'
        : 'Tu procesador no está en la lista de Microsoft.',
    );
  }
  if (e.ramGB < 4) motivos.push('Tiene menos de 4 GB de RAM.');
  if (e.discoGB < 64) motivos.push('El disco tiene menos de 64 GB.');
  if (e.tpm === 'no') motivos.push('No tiene TPM 2.0.');
  if (e.tpm === 'nose') motivos.push('No se pudo confirmar que tenga TPM 2.0.');
  if (e.arranqueSeguro === 'no') motivos.push('No tiene arranque seguro (UEFI).');
  if (e.arranqueSeguro === 'nose') motivos.push('No se pudo confirmar el arranque seguro (UEFI).');
  return { compatible: motivos.length === 0, motivos };
}

export function diagnosticar(e: Equipo): Diagnostico {
  const { compatible, motivos } = evaluarW11(e);
  let veredicto: VeredictoId;
  let titulo: string;
  let recomendacion: string;

  if (compatible) {
    veredicto = 'actualizar';
    titulo = 'No lo deseche: actualícelo';
    recomendacion = 'Actualizar gratis a Windows 11.';
  } else if (e.ramGB < 2 || e.procesador === 'otro') {
    veredicto = 'reciclaje';
    titulo = 'Reciclaje responsable';
    recomendacion = 'Donar piezas útiles y entregar el resto en la Opitatón de la CAM o en EcoCómputo.';
  } else if (e.ramGB >= 8) {
    veredicto = 'linux';
    titulo = 'Segunda vida con Linux';
    recomendacion = 'Linux Mint Cinnamon o Ubuntu LTS.';
  } else if (e.ramGB >= 4) {
    veredicto = 'linux';
    titulo = 'Segunda vida con Linux';
    recomendacion = 'Linux Mint XFCE.';
  } else {
    veredicto = 'mejora';
    titulo = 'Segunda vida con mejora';
    recomendacion = 'Lubuntu o Xubuntu LTS; ampliar a 4 GB si es posible.';
  }

  const recicla = veredicto === 'reciclaje';
  return {
    compatibleW11: compatible,
    motivos,
    veredicto,
    titulo,
    recomendacion,
    mejoraSSD: e.disco === 'hdd' && !recicla,
    impacto: recicla ? null : { ...IMPACTO[e.tipo] },
  };
}

/** URL pública de la web (para el QR), respetando el base path. */
export function urlPublica(origin: string, base: string): string {
  const b = '/' + base.replace(/^\/+|\/+$/g, '');
  return origin.replace(/\/+$/, '') + (b === '/' ? '/' : b + '/');
}
