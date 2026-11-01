import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dinero, fechaCorta, hora } from './formato';

const INDIGO = [79, 70, 229];

// Genera y descarga un PDF con la lista de gastos y un resumen por categoría.
export function exportarGastosPDF({ titulo, subtitulo, gastos, usuario, presupuestos }) {
  const doc = new jsPDF();
  const ancho = doc.internal.pageSize.getWidth();

  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, ancho, 32, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(titulo, 14, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(subtitulo || '', 14, 23);
  if (usuario) doc.text(usuario, ancho - 14, 15, { align: 'right' });
  doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, ancho - 14, 23, { align: 'right' });

  const total = gastos.reduce((s, g) => s + Number(g.monto), 0);
  doc.setTextColor(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total gastado: ${dinero(total)}`, 14, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${gastos.length} registro(s)`, 14, 50);

  // Resumen por categoría
  const porCat = {};
  gastos.forEach((g) => { porCat[g.categoria] = (porCat[g.categoria] || 0) + Number(g.monto); });
  const filasCat = Object.entries(porCat)
    .sort((a, b) => b[1] - a[1])
    .map(([c, t]) => [c, dinero(t), total ? `${((t / total) * 100).toFixed(1)}%` : '0%']);

  autoTable(doc, {
    startY: 56,
    head: [['Categoría', 'Total', '%']],
    body: filasCat,
    theme: 'grid',
    headStyles: { fillColor: INDIGO },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  if (presupuestos?.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Presupuesto', 'Límite', 'Gastado', 'Disponible']],
      body: presupuestos.map((p) => [
        p.categoria, dinero(p.monto), dinero(p.gastado), dinero(Number(p.monto) - Number(p.gastado)),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    });
  }

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Fecha', 'Hora', 'Descripción', 'Categoría', 'Billetera', 'Monto']],
    body: gastos.map((g) => [
      fechaCorta(g.fecha), hora(g.fecha), g.descripcion || '—', g.categoria, g.billetera || 'Sin billetera', dinero(g.monto),
    ]),
    foot: [['', '', '', '', 'Total', dinero(total)]],
    theme: 'striped',
    headStyles: { fillColor: INDIGO },
    footStyles: { fillColor: [241, 245, 249], textColor: 30, fontStyle: 'bold' },
    columnStyles: { 5: { halign: 'right' } },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      const pag = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Mis Gastos · página ${pag}`, ancho / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    },
  });

  const nombre = titulo.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
  doc.save(`${nombre || 'gastos'}.pdf`);
}
