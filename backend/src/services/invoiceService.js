const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const prisma = require('../prisma');

const INVOICE_DIR = path.join(__dirname, '../../uploads/invoices');
if (!fs.existsSync(INVOICE_DIR)) {
  fs.mkdirSync(INVOICE_DIR, { recursive: true });
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

    doc.fontSize(24).font('Helvetica-Bold').text(store.name || 'ShopManager', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(store.address || '', { align: 'center' });
    doc.text(`${store.city || ''}${store.city && store.state ? ', ' : ''}${store.state || ''} ${store.postal_code || ''}`, { align: 'center' });
    doc.text(`Phone: ${store.phone || ''} | Email: ${store.email || ''}`, { align: 'center' });
    if (store.tax_id) doc.text(`Tax ID: ${store.tax_id}`, { align: 'center' });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(18).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    const topY = doc.y;
    doc.text(`Invoice No: ${sale.invoice_number}`, 50, topY);
    doc.text(`Date: ${new Date(sale.created_at).toLocaleDateString()}`, 50, topY + 15);
    doc.text(`Status: ${sale.status.toUpperCase()}`, 50, topY + 30);
    doc.text(`Payment: ${sale.payment_status.toUpperCase()}`, 50, topY + 45);

    if (customer) {
      doc.text('Bill To:', 350, topY);
      doc.text(customer.name, 350, topY + 15);
      doc.text(customer.address || '', 350, topY + 45);
      doc.text(`${customer.city || ''} ${customer.state || ''} ${customer.postal_code || ''}`, 350, topY + 60);
      doc.text(`Phone: ${customer.phone || ''}`, 350, topY + 75);
      if (customer.email) doc.text(customer.email, 350, topY + 90);
    }

    doc.moveDown(3);

    const tableTop = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    const col1 = 50, col2 = 130, col3 = 320, col4 = 400, col5 = 470, col6 = 510;
    const rowHeight = 20;

    doc.rect(50, tableTop - 5, 495, rowHeight).fill('#f0f0f0');
    doc.fillColor('#000000');

    doc.text('#', col1, tableTop, { width: 30 });
    doc.text('Product', col2, tableTop, { width: 190 });
    doc.text('Price', col3, tableTop, { width: 80, align: 'right' });
    doc.text('Qty', col4, tableTop, { width: 70, align: 'right' });
    doc.text('Disc', col5, tableTop, { width: 40, align: 'right' });
    doc.text('Total', col6, tableTop, { width: 35, align: 'right' });

    doc.moveDown();
    let currentY = doc.y;
    doc.font('Helvetica').fontSize(9);

    if (sale.items && sale.items.length > 0) {
      sale.items.forEach((item, index) => {
        const itemTotal = parseFloat(item.total).toFixed(2);
        const unitPrice = parseFloat(item.unit_price).toFixed(2);
        const qty = parseFloat(item.quantity);
        const disc = parseFloat(item.discount_amount || 0).toFixed(2);

        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        doc.text(String(index + 1), col1, currentY, { width: 30 });
        doc.text(item.product_name || item.product?.name || '', col2, currentY, { width: 190 });
        doc.text(unitPrice, col3, currentY, { width: 80, align: 'right' });
        doc.text(qty % 1 === 0 ? String(qty) : qty.toFixed(3), col4, currentY, { width: 70, align: 'right' });
        doc.text(disc, col5, currentY, { width: 40, align: 'right' });
        doc.text(itemTotal, col6, currentY, { width: 35, align: 'right' });
        currentY += rowHeight;
      });
    }

    doc.moveDown(2);
    const summaryY = Math.max(currentY + 10, doc.y + 10);

    doc.font('Helvetica-Bold');
    doc.text('Subtotal:', 350, summaryY);
    doc.text(parseFloat(sale.subtotal).toFixed(2), 480, summaryY, { align: 'right' });

    if (parseFloat(sale.discount_amount) > 0) {
      doc.text('Discount:', 350, summaryY + 18);
      doc.text(`-${parseFloat(sale.discount_amount).toFixed(2)}`, 480, summaryY + 18, { align: 'right' });
    }

    if (parseFloat(sale.tax_amount) > 0) {
      doc.text('Tax:', 350, summaryY + 36);
      doc.text(parseFloat(sale.tax_amount).toFixed(2), 480, summaryY + 36, { align: 'right' });
    }

    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold');
    const totalY = summaryY + 60;
    doc.text('Total:', 350, totalY);
    doc.text(`${store.currency || '$'} ${parseFloat(sale.total_amount).toFixed(2)}`, 440, totalY, { align: 'right' });

    doc.fontSize(10);
    doc.text(`Paid: ${parseFloat(sale.paid_amount).toFixed(2)}`, 350, totalY + 20);
    doc.text(`Due: ${parseFloat(sale.due_amount).toFixed(2)}`, 350, totalY + 38);

    if (sale.notes) {
      doc.moveDown(3);
      doc.fontSize(9).font('Helvetica');
      doc.text(`Notes: ${sale.notes}`, 50, doc.y, { width: 495 });
    }

    if (store.receipt_footer) {
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica').text(store.receipt_footer, { align: 'center', width: 495 });
    }

    doc.fontSize(8).font('Helvetica').fillColor('#888888');
    doc.text(`Generated by ShopManager | ${new Date().toLocaleString()}`, 50, 780, { align: 'center', width: 495 });
    doc.fillColor('#000000');

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
