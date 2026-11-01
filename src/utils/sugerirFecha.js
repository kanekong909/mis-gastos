import { MESES, aInputFecha } from './formato';

const pad = (n) => String(n).padStart(2, '0');
const claveMes = (f) => String(f).slice(0, 7); // "2026-08"
const sinTildes = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const DOCE_HORAS = 12 * 3600;

const NOMBRES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};
const PATRON_MES = new RegExp(`\\b(${Object.keys(NOMBRES).join('|')})\\b`);

const describir = (clave, fechaInput, motivo) => {
  const [anio, mes] = clave.split('-').map(Number);
  const dia = Number(fechaInput.slice(8, 10));
  return {
    clave,
    fecha: fechaInput,
    motivo,
    etiqueta: `${MESES[mes - 1].toLowerCase()} de ${anio}`,
    diaTexto: `${dia} de ${MESES[mes - 1].toLowerCase()}`,
  };
};

// Mes que el usuario parece estar registrando, según los últimos gastos que ingresó:
// los dos más recientes son del mismo mes (no el actual) y se ingresaron hace poco.
function mesDeLosUltimosRegistros(recientes, claveActual) {
  if (!recientes || recientes.length < 2) return null;
  const [a, b] = recientes;
  const ahora = Date.now() / 1000;
  if (claveMes(a.fecha) !== claveMes(b.fecha)) return null;
  if (claveMes(a.fecha) === claveActual) return null;
  if (ahora - Number(a.creado_ts) > DOCE_HORAS) return null;
  if (Math.abs(Number(a.creado_ts) - Number(b.creado_ts)) > DOCE_HORAS) return null;
  return describir(claveMes(a.fecha), aInputFecha(a.fecha), 'recientes');
}

// Devuelve { clave, fecha, etiqueta, diaTexto, motivo } o null si no hay nada que sugerir.
// Solo sugiere mientras el formulario siga con una fecha del mes actual (la de por defecto).
export function sugerirFecha({ descripcion, fechaForm, recientes }) {
  const hoy = new Date();
  const claveActual = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}`;
  if (claveMes(fechaForm) !== claveActual) return null;

  const delUso = mesDeLosUltimosRegistros(recientes, claveActual);

  // 1. El usuario escribió un mes en la descripción ("arriendo agosto").
  const coincidencia = PATRON_MES.exec(sinTildes(descripcion || ''));
  if (coincidencia) {
    const mes = NOMBRES[coincidencia[1]];
    // Un mes posterior al actual se entiende del año pasado.
    const anio = mes > hoy.getMonth() + 1 ? hoy.getFullYear() - 1 : hoy.getFullYear();
    const clave = `${anio}-${pad(mes)}`;
    if (clave !== claveActual) {
      // Si además sus últimos registros son de ese mes, se propone el mismo día.
      return delUso?.clave === clave
        ? { ...delUso, motivo: 'descripcion' }
        : describir(clave, `${clave}-01T12:00`, 'descripcion');
    }
  }

  // 2. Viene registrando varios gastos de un mes anterior.
  return delUso;
}
