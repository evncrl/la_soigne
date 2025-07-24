const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* ✅ Helper: Generate PDF Invoice */
function generateInvoicePDF(orderId, status, products, totalPrice, pdfPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // ✅ HEADER
    doc
      .fontSize(22)
      .fillColor("#000")
      .font("Helvetica-Bold")
      .text("La Soigne - Order Receipt", { align: "center" })
      .moveDown();

    // ✅ Order Info
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Order ID: ${orderId}`, { continued: true })
      .text(`   Status: `, { continued: true })
      .fillColor("#28a745")
      .font("Helvetica-Bold")
      .text(status.toUpperCase())
      .moveDown();

    // ✅ Table setup
    const tableTop = doc.y;
    const colWidths = [220, 60, 100, 100];
    const rowHeight = 25;

    const drawCell = (x, y, w, h, text, options = {}) => {
      const {
        bold = false,
        align = "left",
        fill = "#fff",
        border = true,
        textColor = "#000"
      } = options;

      // Background + border
      doc.rect(x, y, w, h).fillAndStroke(fill, border ? "#000" : fill);

      // Text
      doc
        .fillColor(textColor)
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(10)
        .text(text, x + 8, y + 8, { width: w - 16, align });
    };

    // ✅ Header Row
    const headers = ["Product", "Qty", "Price", "Subtotal"];
    let x = 50;
    headers.forEach((header, i) => {
      drawCell(x, tableTop, colWidths[i], rowHeight, header, {
        bold: true,
        fill: "#e9ecef"
      });
      x += colWidths[i];
    });

    // ✅ Product Rows
    let y = tableTop + rowHeight;
    products.forEach((item, idx) => {
      const price = parseFloat(item.price).toFixed(2);
      const subtotal = (item.price * item.quantity).toFixed(2);
      const bg = idx % 2 === 0 ? "#fff" : "#f8f9fa";

      const row = [
        item.name,
        item.quantity,
        `₱${price}`,
        `₱${subtotal}`
      ];
      x = 50;
      row.forEach((cell, i) => {
        drawCell(x, y, colWidths[i], rowHeight, cell, { fill: bg });
        x += colWidths[i];
      });
      y += rowHeight;
    });

    // ✅ Total Row
    drawCell(50, y, colWidths[0] + colWidths[1] + colWidths[2], rowHeight, "Total", {
      bold: true,
      align: "right",
      fill: "#e9ecef"
    });
    drawCell(50 + colWidths[0] + colWidths[1] + colWidths[2], y, colWidths[3], rowHeight, `₱${totalPrice.toFixed(2)}`, {
      bold: true,
      align: "right",
      fill: "#e9ecef"
    });

    // ✅ Footer Message
    doc
      .moveDown(3)
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#444")
      .text("We hope you enjoy your purchase. Thank you for choosing La Soigne!", {
        align: "center"
      });

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}




/* ✅ Main Function: Send Order Status Email with PDF */
async function sendStatusUpdateEmail(customerEmail, orderId, newStatus, products = []) {
  let message = "";
  let statusColor = "#333";

  switch (newStatus) {
    case "Shipped":
      statusColor = "#2196F3";
      message = `
        <div style="background:${statusColor};color:white;padding:10px 15px;border-radius:5px;
                    display:inline-block;font-size:16px;font-weight:bold;">
          🚚 Your order has been SHIPPED
        </div>
        <p style="margin-top:10px;">You can expect delivery soon. Thank you for shopping with us!</p>
      `;
      break;
    case "Delivered":
      statusColor = "#4CAF50";
      message = `
        <div style="background:${statusColor};color:white;padding:10px 15px;border-radius:5px;
                    display:inline-block;font-size:16px;font-weight:bold;">
          📦 Your order has been DELIVERED
        </div>
        <p style="margin-top:10px;">We hope you enjoy your purchase. Thank you for choosing La Soigne!</p>
      `;
      break;
    case "Cancelled":
      statusColor = "#F44336";
      message = `
        <div style="background:${statusColor};color:white;padding:10px 15px;border-radius:5px;
                    display:inline-block;font-size:16px;font-weight:bold;">
          ❌ Your order has been CANCELLED
        </div>
        <p style="margin-top:10px;">If you have questions, please contact our support team.</p>
      `;
      break;
    default:
      statusColor = "#FF9800";
      message = `
        <div style="background:${statusColor};color:white;padding:10px 15px;border-radius:5px;
                    display:inline-block;font-size:16px;font-weight:bold;">
          ℹ️ Order status: ${newStatus.toUpperCase()}
        </div>
      `;
  }

  // ✅ Build Table of Products
  let totalPrice = 0;
  let rows = products
    .map((item) => {
      const price = parseFloat(item.price);
      const subtotal = price * item.quantity;
      totalPrice += subtotal;
      return `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${item.name}</td>
          <td style="padding:8px;border:1px solid #ddd;">${item.quantity}</td>
          <td style="padding:8px;border:1px solid #ddd;">₱${price.toFixed(2)}</td>
          <td style="padding:8px;border:1px solid #ddd;">₱${subtotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const tableHTML = `
    <h4>Order Details (Order #${orderId}):</h4>
    <table style="border-collapse: collapse; width:100%; max-width:500px;">
      <thead>
        <tr style="background:#f2f2f2;">
          <th style="padding:8px;border:1px solid #ddd;">Product</th>
          <th style="padding:8px;border:1px solid #ddd;">Qty</th>
          <th style="padding:8px;border:1px solid #ddd;">Price</th>
          <th style="padding:8px;border:1px solid #ddd;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr style="font-weight:bold;">
          <td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right;">Total:</td>
          <td style="padding:8px;border:1px solid #ddd;">₱${totalPrice.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  `;

  // ✅ Save PDF in public/invoices for Download Link
  const pdfDir = path.join(__dirname, "../public/invoices");
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  const pdfPath = path.join(pdfDir, `order_${orderId}.pdf`);
  await generateInvoicePDF(orderId, newStatus, products, totalPrice, pdfPath);

  const downloadLink = `http://localhost:4000/invoices/order_${orderId}.pdf`;

  try {
    await transporter.sendMail({
      from: '"La Soigne Admin" <no-reply@lasoigne.com>',
      to: customerEmail,
      subject: `Order #${orderId} Status Update: ${newStatus}`,
      html: `
        <h3>Hello,</h3>
        ${message}
        ${tableHTML}
        <p>
          <a href="${downloadLink}" 
             style="display:inline-block;margin-top:15px;padding:10px 20px;
                    background:#4CAF50;color:white;text-decoration:none;
                    border-radius:5px;font-weight:bold;">
            ⬇ Download Invoice (PDF)
          </a>
        </p>
        <p>❤️ La Soigne Team</p>
      `,
      attachments: [
        {
          filename: `order_${orderId}.pdf`,
          path: pdfPath,
        },
      ],
    });
    console.log(`✅ Email with PDF sent to ${customerEmail}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
}

module.exports = { sendStatusUpdateEmail };
