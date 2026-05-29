const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const prisma = require('../prisma');

const INVOICE_DIR = path.join(__dirname, '../../uploads/invoices');
if (!fs.existsSync(INVOICE_DIR)) {
  fs.mkdirSync(INVOICE_DIR, { recursive: true });
}

function formatCurrency(amount, currency = '$') {
  return `${currency} ${parseFloat(amount || 0).toFixed(2)}`;
}

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${mins}`;
}

function drawTableRow(doc, x, y, cols, data, opts = {}) {
  const { font = 'Helvetica', fontSize = 9, fill = false, fillColor = '#f9f9f9' } = opts;
  doc.font(font).fontSize(fontSize);
  if (fill) {
    doc.rect(x, y - 4, cols[cols.length - 1].x + cols[cols.length - 1].w - x, 22).fill(fillColor);
    doc.fillColor('#000');
  }
  data.forEach((d, i) => {
    const col = cols[i];
    doc.text(String(d), col.x, y, { width: col.w, align: col.align || 'left' });
  });
}

const generateInvoice = async (saleId, storeId) => {
  const sale = await prisma.sale.findFirst({
    where: { id: BigInt(saleId), store_id: storeId },
    include: {
      customer: true,
      store: true,
      items: { include: { product: true } },
      payments: true,
    },
  });

  if (!sale) throw new Error('Sale not found');

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filename = `invoice_${sale.invoice_number.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
  const filepath = path.join(INVOICE_DIR, filename);
  const stream = fs.createWriteStream(filepath);

  return new Promise((resolve, reject) => {
    doc.pipe(stream);

    const store = sale.store;
    const customer = sale.customer;
    const curr = store.currency || '$';
    const pageW = 495;
    const left = 50;
    const right = left + pageW;

    // ── HEADER ──
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#1a1a2e').text(store.name || 'ShopManager', left, 50, { align: 'center' });
    doc.fontSize(9).font('Helvetica').fillColor('#555');
    if (store.address) doc.text(store.address, { align: 'center' });
    const loc = [store.city, store.state, store.postal_code].filter(Boolean).join(', ');
    if (loc) doc.text(loc, { align: 'center' });
    const contact = [store.phone && `Tel: ${store.phone}`, store.email].filter(Boolean).join(' | ');
    if (contact) doc.text(contact, { align: 'center' });
    if (store.tax_id) doc.text(`Tax ID: ${store.tax_id}`, { align: 'center' });
    doc.fillColor('#000');

    // separator
    doc.moveDown(0.5);
    const headerEnd = doc.y;
    doc.moveTo(left, headerEnd).lineTo(right, headerEnd).lineWidth(1.5).strokeColor('#1a1a2e').stroke();
    doc.lineWidth(1).strokeColor('#000');

    // ── INVOICE TITLE ──
    doc.moveDown(0.5);
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a2e').text('INVOICE', left, doc.y, { align: 'center' });
    doc.fillColor('#000');
    doc.moveDown(0.3);
    doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#ddd').stroke();
    doc.moveDown(0.5);

    // ── INFO BLOCK (two columns) ──
    const infoY = doc.y;
    const colLeft = left;
    const colRight = left + 280;
    const infoW = 170;

    doc.fontSize(9).font('Helvetica');
    doc.fillColor('#333');
    doc.text('Invoice Number', colLeft, infoY, { width: infoW });
    doc.text('Date', colLeft, infoY + 14, { width: infoW });
    doc.text('Status', colLeft, infoY + 28, { width: infoW });
    doc.text('Payment', colLeft, infoY + 42, { width: infoW });

    doc.font('Helvetica-Bold');
    doc.text(sale.invoice_number, colLeft + 100, infoY, { width: infoW });
    doc.text(formatDate(sale.created_at), colLeft + 100, infoY + 14, { width: infoW });
    doc.text(sale.status.toUpperCase(), colLeft + 100, infoY + 28, { width: infoW });
    doc.text(sale.payment_status.toUpperCase(), colLeft + 100, infoY + 42, { width: infoW });
    doc.fillColor('#000');

    // ── CUSTOMER ──
    if (customer) {
      doc.fontSize(9).font('Helvetica').fillColor('#333');
      doc.text('Customer', colRight, infoY, { width: infoW });
      doc.text('Phone', colRight, infoY + 14, { width: infoW });
      if (customer.address) doc.text('Address', colRight, infoY + 28, { width: infoW });

      doc.font('Helvetica-Bold').fillColor('#000');
      doc.text(customer.name, colRight + 70, infoY, { width: infoW });
      doc.text(customer.phone || '—', colRight + 70, infoY + 14, { width: infoW });
      if (customer.address) doc.text(customer.address, colRight + 70, infoY + 28, { width: infoW });
      doc.fillColor('#000');
    } else {
      doc.fontSize(9).font('Helvetica').fillColor('#999');
      doc.text('Walk-in Customer', colRight, infoY, { width: infoW });
      doc.fillColor('#000');
    }

    doc.moveDown(4);

    // ── ITEMS TABLE ──
    const tableTop = doc.y;
    const cols = [
      { x: left, w: 30, align: 'center' },
      { x: left + 32, w: 175 },
      { x: left + 210, w: 70, align: 'right' },
      { x: left + 282, w: 50, align: 'center' },
      { x: left + 335, w: 70, align: 'right' },
      { x: left + 410, w: 85, align: 'right' },
    ];
    const rowH = 22;

    // header row
    doc.rect(left, tableTop - 4, pageW, rowH).fill('#1a1a2e');
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(9);
    doc.text('#', cols[0].x, tableTop, { width: cols[0].w, align: cols[0].align });
    doc.text('Product', cols[1].x, tableTop, { width: cols[1].w, align: cols[1].align });
    doc.text('Price', cols[2].x, tableTop, { width: cols[2].w, align: cols[2].align });
    doc.text('Qty', cols[3].x, tableTop, { width: cols[3].w, align: cols[3].align });
    doc.text('Discount', cols[4].x, tableTop, { width: cols[4].w, align: cols[4].align });
    doc.text('Total', cols[5].x, tableTop, { width: cols[5].w, align: cols[5].align });
    doc.fillColor('#000');

    let y = tableTop + rowH;
    doc.font('Helvetica').fontSize(9);

    if (sale.items && sale.items.length > 0) {
      sale.items.forEach((item, index) => {
        if (y > 720) {
          doc.addPage();
          y = 50;
        }

        const bgColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
        doc.rect(left, y - 4, pageW, rowH).fill(bgColor);
        doc.fillColor('#000');

        const name = item.product_name || item.product?.name || '';
        const displayName = name.length > 40 ? name.slice(0, 38) + '..' : name;

        doc.text(String(index + 1), cols[0].x, y, { width: cols[0].w, align: cols[0].align });
        doc.text(displayName, cols[1].x, y, { width: cols[1].w });
        doc.text(formatCurrency(item.unit_price, '').trim(), cols[2].x, y, { width: cols[2].w, align: cols[2].align });
        doc.text(parseFloat(item.quantity) % 1 === 0 ? String(parseFloat(item.quantity)) : parseFloat(item.quantity).toFixed(3), cols[3].x, y, { width: cols[3].w, align: cols[3].align });
        doc.text(parseFloat(item.discount_amount || 0) > 0 ? `-${formatCurrency(item.discount_amount, '').trim()}` : '—', cols[4].x, y, { width: cols[4].w, align: cols[4].align });
        doc.text(formatCurrency(item.total, '').trim(), cols[5].x, y, { width: cols[5].w, align: cols[5].align });
        y += rowH;
      });
    }

    // bottom separator
    y += 4;
    doc.moveTo(left + 230, y).lineTo(right, y).lineWidth(1).strokeColor('#1a1a2e').stroke();
    doc.lineWidth(1).strokeColor('#000');
    y += 12;

    // ── PRICE BREAKDOWN ──
    const summaryLeft = left + 230;
    const summaryRight = right;
    const summaryW = summaryRight - summaryLeft;
    const labelX = summaryLeft;
    const valueX = summaryLeft + 120;
    const lineH = 18;

    doc.fontSize(10).font('Helvetica').fillColor('#333');
    doc.text('Subtotal:', labelX, y, { width: summaryW - 120 });
    doc.text(formatCurrency(sale.subtotal, curr), valueX, y, { width: 120, align: 'right' });
    y += lineH;

    if (parseFloat(sale.discount_amount) > 0) {
      doc.text('Discount:', labelX, y, { width: summaryW - 120 });
      doc.fillColor('#d32f2f').text(`-${formatCurrency(sale.discount_amount, curr)}`, valueX, y, { width: 120, align: 'right' });
      doc.fillColor('#333');
      y += lineH;
    }

    if (parseFloat(sale.tax_amount) > 0) {
      doc.text('Tax:', labelX, y, { width: summaryW - 120 });
      doc.text(formatCurrency(sale.tax_amount, curr), valueX, y, { width: 120, align: 'right' });
      y += lineH;
    }

    if (parseFloat(sale.shipping_cost) > 0) {
      doc.text('Shipping:', labelX, y, { width: summaryW - 120 });
      doc.text(formatCurrency(sale.shipping_cost, curr), valueX, y, { width: 120, align: 'right' });
      y += lineH;
    }

    // total
    y += 2;
    doc.moveTo(summaryLeft, y).lineTo(right, y).strokeColor('#ddd').stroke();
    y += 4;
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a1a2e');
    doc.text('Total:', labelX, y, { width: summaryW - 120 });
    doc.text(formatCurrency(sale.total_amount, curr), valueX, y, { width: 120, align: 'right' });
    y += lineH + 4;

    // paid & due
    doc.fontSize(10).font('Helvetica').fillColor('#333');
    if (parseFloat(sale.paid_amount) > 0) {
      doc.text('Paid:', labelX, y, { width: summaryW - 120 });
      doc.fillColor('#2e7d32').text(formatCurrency(sale.paid_amount, curr), valueX, y, { width: 120, align: 'right' });
      doc.fillColor('#333');
      y += lineH;
    }
    if (parseFloat(sale.due_amount) > 0) {
      doc.text('Due:', labelX, y, { width: summaryW - 120 });
      doc.fillColor('#d32f2f').text(formatCurrency(sale.due_amount, curr), valueX, y, { width: 120, align: 'right' });
      doc.fillColor('#333');
      y += lineH;
    }
    if (parseFloat(sale.paid_amount) > 0 && parseFloat(sale.due_amount) <= 0) {
      doc.text('Change:', labelX, y, { width: summaryW - 120 });
      doc.fillColor('#2e7d32').text(formatCurrency(parseFloat(sale.paid_amount) - parseFloat(sale.total_amount), curr), valueX, y, { width: 120, align: 'right' });
      doc.fillColor('#333');
      y += lineH;
    }

    // ── NOTES ──
    if (sale.notes) {
      y += 6;
      doc.moveTo(left, y).lineTo(right, y).strokeColor('#ddd').stroke();
      y += 8;
      doc.fontSize(9).font('Helvetica').fillColor('#555');
      doc.text(`Notes: ${sale.notes}`, left, y, { width: pageW });
      doc.fillColor('#000');
    }

    // ── PAYMENT INFO ──
    if (sale.payments && sale.payments.length > 0) {
      y = doc.y + 12;
      doc.moveTo(left, y).lineTo(right, y).strokeColor('#ddd').stroke();
      y += 8;
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333');
      doc.text('Payment History', left, y, { width: pageW });
      doc.font('Helvetica').fontSize(8).fillColor('#555');
      y += 14;
      sale.payments.forEach(p => {
        doc.text(`${formatDate(p.payment_date)} — ${p.payment_method.toUpperCase()} — ${formatCurrency(p.amount, curr)}`, left + 10, y, { width: pageW - 10 });
        y += 12;
      });
      doc.fillColor('#000');
    }

    // ── FOOTER ──
    y = Math.max(y + 10, 730);
    if (store.receipt_footer) {
      doc.moveTo(left, y).lineTo(right, y).strokeColor('#ddd').stroke();
      y += 6;
      doc.fontSize(8).font('Helvetica').fillColor('#555').text(store.receipt_footer, left, y, { align: 'center', width: pageW });
      y += 14;
    }

    doc.fontSize(7).font('Helvetica').fillColor('#aaa');
    doc.text(`Generated by ShopManager POS — ${formatDate(new Date())}`, left, y, { align: 'center', width: pageW });
    doc.fillColor('#000');

    doc.end();

    stream.on('finish', () => {
      resolve({ filename, filepath, url: `/uploads/invoices/${filename}` });
    });
    stream.on('error', reject);
  });
};

const generateReceipt = async (saleId, storeId) => {
  return generateInvoice(saleId, storeId);
};

module.exports = { generateInvoice, generateReceipt };
