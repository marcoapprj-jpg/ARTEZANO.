import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order } from "@/lib/types";
import { brl, formatDateTime, TYPE_LABELS } from "@/lib/format";

let logoData: string | null = null;
// Preload the logo so PDF generation stays synchronous inside the click (share needs a user gesture).
const logoPromise = fetch("/logo.jpg")
  .then((r) => r.blob())
  .then(
    (b) =>
      new Promise<string>((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result));
        fr.readAsDataURL(b);
      }),
  )
  .then((d) => {
    logoData = d;
    return d;
  })
  .catch(() => null);

export function buildOrderPdf(o: Order): File {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(61, 35, 20);
  doc.rect(0, 0, W, 38, "F");
  if (logoData) doc.addImage(logoData, "JPEG", 12, 5, 28, 28);
  doc.setTextColor(253, 248, 243);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Artezano Pudim", 46, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Feito com carinho", 46, 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`PEDIDO Nº ${o.number}`, W - 12, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(formatDateTime(o.created_at), W - 12, 25, { align: "right" });

  doc.setTextColor(44, 24, 16);
  let y = 50;
  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(value || "-", 62, y);
    y += 7;
  };
  doc.setFontSize(11);
  row("Cliente:", o.customer_name);
  row("Tipo:", TYPE_LABELS[o.customer_type]);
  row("Forma de pagamento:", o.payment_method);
  row("Prazo p/ pagamento:", o.payment_term);
  row("Entrega:", o.delivery);
  if (o.notes) row("Observações:", o.notes);

  autoTable(doc, {
    startY: y + 3,
    head: [["SKU", "Item", "Qtd", "Preço unit.", "Subtotal"]],
    body: o.items.map((i) => [i.sku || "-", i.name, String(i.quantity), brl(i.price), brl(i.price * i.quantity)]),
    styles: { fontSize: 10, cellPadding: 3, textColor: [44, 24, 16] },
    bodyStyles: { fontStyle: "bold" },
    headStyles: { fillColor: [184, 93, 25], textColor: 255 },
    alternateRowStyles: { fillColor: [251, 247, 242] },
    columnStyles: { 2: { halign: "center" }, 3: { halign: "right" }, 4: { halign: "right" } },
  });
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`TOTAL: ${brl(o.total)}`, W - 14, finalY + 12, { align: "right" });

  const blob = doc.output("blob");
  return new File([blob], `pedido-${o.number}-artezano.pdf`, { type: "application/pdf" });
}

/** Share via the device share sheet (pick WhatsApp); falls back to a download. Returns "shared" | "downloaded". */
export async function shareOrderPdf(o: Order): Promise<"shared" | "downloaded" | "cancelled"> {
  if (!logoData) await logoPromise;
  const file = buildOrderPdf(o);
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Pedido Nº ${o.number}`, text: `Pedido Nº ${o.number} — Artezano Pudim` });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
}
