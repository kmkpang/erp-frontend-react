import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Thai Baht Text Helper
const toThaiBaht = (number) => {
	if (!number || isNaN(number)) return "ศูนย์บาทถ้วน";
	const numbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
	const scales = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
	let [integer, decimals] = parseFloat(number).toFixed(2).split(".");
	let result = "";

	// Handle millions if number is very large
	const handlePart = (numStr) => {
		let partResult = "";
		for (let i = 0; i < numStr.length; i++) {
			let n = parseInt(numStr[i]);
			let scaleIndex = numStr.length - i - 1;
			if (n !== 0) {
				if (scaleIndex === 0 && n === 1 && numStr.length > 1) partResult += "เอ็ด";
				else if (scaleIndex === 1 && n === 2) partResult += "ยี่";
				else if (scaleIndex === 1 && n === 1) partResult += "";
				else partResult += numbers[n];
				partResult += scales[scaleIndex];
			}
		}
		return partResult;
	};

	if (parseInt(integer) === 0) result = numbers[0];
	else {
		let parts = [];
		while (integer.length > 0) {
			parts.push(integer.substring(Math.max(0, integer.length - 6)));
			integer = integer.substring(0, Math.max(0, integer.length - 6));
		}
		for (let i = parts.length - 1; i >= 0; i--) {
			result += handlePart(parts[i]);
			if (i > 0) result += "ล้าน";
		}
	}
	result += "บาท";

	if (parseInt(decimals) === 0) result += "ถ้วน";
	else {
		result += handlePart(decimals) + "สตางค์";
	}
	return result;
};

// Helper for phone formatting
const formatPhoneNumber = (phoneNumber) => {
	if (!phoneNumber) return "-";
	const cleaned = ("" + phoneNumber).replace(/\D/g, "");
	const match = cleaned.match(/^(\d{2,3})(\d{3})(\d{4})$/);
	if (match) {
		return `${match[1]}-${match[2]}-${match[3]}`;
	}
	return phoneNumber;
};

export const generatePDF = async (
	action,
	row,
	businessData,
	productQuery,
	setPdfUrl,
	setShowPdfModal
) => {
	const doc = new jsPDF();
	const orangeColor = [255, 165, 0];
	const blueColor = [0, 87, 183];

	// Load Fonts
	try {
		const thSarabunNew = (await import("../../font/THSarabunNew-normal.js")).default;

		doc.addFileToVFS("THSarabunNew.ttf", thSarabunNew);
		doc.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
	} catch (error) {
		console.error("Error loading fonts:", error);
		// Fallback to standard font if custom font fails
	}

	const products = row.productForms || row.products || row.details || [];

	// Date Formatting
	let billingDate = new Date();
	if (row.billing_date) {
		billingDate = new Date(row.billing_date);
		if (isNaN(billingDate.getTime())) billingDate = new Date();
	}
	const day = billingDate.getDate().toString().padStart(2, "0");
	const month = (billingDate.getMonth() + 1).toString().padStart(2, "0");
	const buddhistYear = billingDate.getFullYear() + 543;
	const displayDate = `${day}/${month}/${buddhistYear}`;

	// Header Section
	const renderHeader = () => {
		// Logo
		if (businessData?.bus_logo) {
			try {
				doc.addImage(businessData.bus_logo, "JPEG", 10, 10, 25, 20);
			} catch (e) {
				console.warn("Logo load failed", e);
			}
		}

		// Company Info
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(22);
		doc.text(businessData?.bus_name || "-", 40, 18);

		if (businessData?.bus_code === "00000") {
			doc.setFontSize(14);
			doc.text("(สำนักงานใหญ่)", 40, 24);
		}

		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(14);
		const addressLines = doc.splitTextToSize(businessData?.bus_address || "", 100);
		doc.text(addressLines, 10, 38);
		doc.text(`เลขประจำตัวผู้เสียภาษี  ${businessData?.bus_tax || "-"}`, 10, 51);
		doc.text(`โทร  ${formatPhoneNumber(businessData?.bus_tel) || "-"}`, 10, 56);

		// Title Box
		doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
		doc.setLineWidth(0.5);
		doc.rect(140, 10, 60, 20);
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(18);
		doc.text("ใบกำกับภาษี/ใบเสร็จรับเงิน", 170, 22, { align: "center" });
	};

	// Customer & Document Info
	const renderSectionBoxes = () => {
		// Customer Box
		doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
		doc.rect(10, 60, 130, 35);

		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(14);
		doc.text("ชื่อลูกค้า / Customers:", 12, 65);
		doc.text("ที่อยู่ / Address:", 12, 75);
		doc.text("เบอร์โทรศัพท์", 12, 85);
		doc.text("เลขประจำตัวผู้เสียภาษี", 12, 90);

		doc.setFont("THSarabunNew", "normal");
		doc.text(row.cus_name || "-", 45, 65);
		const cusAddressLines = doc.splitTextToSize(row.cus_address || "-", 90);
		doc.text(cusAddressLines, 45, 75);
		doc.text(formatPhoneNumber(row.cus_tel) || "-", 45, 85);
		doc.text(row.cus_tax || "-", 45, 90);

		// Billing Info Box
		doc.rect(142, 60, 58, 35);
		doc.setFont("THSarabunNew", "normal");
		doc.text("เลขที่ / No.", 145, 78);
		doc.text("วันที่ / Date", 145, 88);

		doc.setFont("THSarabunNew", "normal");
		doc.text(row.billing || "", 170, 78);
		doc.text(displayDate, 170, 88);
	};

	// Calculations for footer
	const price = parseFloat(row.sale_totalprice || 0);
	let finalTotal = price; // รวมเงิน (Total / Subtotal)
	let vatAmount = 0;
	let netAmount = price; // ยอดเงินสุทธิ (Net Amount)

	if (row.vatType === "included-vat") {
		// Price includes VAT
		netAmount = price;
		vatAmount = (price * 7) / 107;
		finalTotal = (price * 100) / 107;
	} else if (row.vatType === "excluded-vat") {
		// Price excludes VAT
		finalTotal = price;
		vatAmount = price * 0.07;
		netAmount = price + vatAmount;
	}

	const renderFooter = (lastY) => {
		const finalY = lastY + 2;
		const summaryX = 142;
		const summaryW = 58;

		doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
		doc.setLineWidth(0.2);

		// Totals Table
		// Total
		doc.rect(summaryX, finalY, summaryW, 10);
		doc.setFont("THSarabunNew", "normal");
		doc.text("รวมเงิน", summaryX + 2, finalY + 4);
		doc.text("TOTAL", summaryX + 2, finalY + 8);
		doc.text(
			finalTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
			summaryX + summaryW - 2,
			finalY + 7,
			{ align: "right" }
		);

		// VAT
		doc.rect(summaryX, finalY + 10, summaryW, 10);
		doc.text("VAT", summaryX + 2, finalY + 14);
		doc.text("7%", summaryX + 2, finalY + 18);
		const vatDisplay =
			row.vatType === "non-vat"
				? ""
				: vatAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
		doc.text(vatDisplay, summaryX + summaryW - 2, finalY + 17, { align: "right" });

		// Net Amount
		doc.setFillColor(255, 235, 204);
		doc.rect(summaryX, finalY + 20, 30, 15, "F"); // Label bg
		doc.rect(summaryX, finalY + 20, summaryW, 15); // Outline

		doc.setFont("THSarabunNew", "normal");
		doc.text("ยอดเงินสุทธิ", summaryX + 2, finalY + 26);
		doc.text("NET AMOUNT", summaryX + 2, finalY + 32);
		doc.setFontSize(16);
		doc.text(
			netAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
			198,
			finalY + 28,
			{ align: "right" }
		);

		// Payment Section (Left side)
		doc.setFontSize(13);
		doc.text("รายการรับชำระเงิน :", 10, finalY + 5);

		const drawCheckbox = (x, y, label, checked = false) => {
			doc.setDrawColor(0, 0, 0);
			doc.rect(x, y - 3.5, 4, 4);
			if (checked) {
				doc.line(x + 0.5, y - 1.5, x + 1.5, y + 0.5);
				doc.line(x + 1.5, y + 0.5, x + 3.5, y - 3.5);
			}
			doc.text(label, x + 6, y);
		};

		drawCheckbox(
			45,
			finalY + 5,
			"เงินสด",
			row.payment_method === "เงินสด" || row.payments === "Cash" || row.payments === "เงินสด"
		);
		drawCheckbox(
			85,
			finalY + 5,
			"เงินโอน",
			row.payment_method === "เงินโอน" ||
				row.payments === "MobileBank" ||
				row.payments === "เงินโอน"
		);
		drawCheckbox(
			125,
			finalY + 5,
			"เช็ค",
			row.payment_method === "เช็ค" || row.payments === "Cheque" || row.payments === "เช็ค"
		);

		// Bank Details
		doc.setFont("THSarabunNew", "normal");
		doc.text("ธนาคาร/Bank", 12, finalY + 12);
		doc.text(row.pay_bank || "", 38, finalY + 12);
		doc.text("...............................................", 38, finalY + 12.5);

		doc.text("เลขที่/ Chq #", 75, finalY + 12);
		doc.text(row.pay_number || "", 98, finalY + 12);
		doc.text("...............................................", 98, finalY + 12.5);

		doc.text("สาขา/Branch", 12, finalY + 22);
		doc.text(row.pay_branch || "", 38, finalY + 22);
		doc.text("...............................................", 38, finalY + 22.5);

		let payDate = "";
		if (row.pay_date) {
			const d = new Date(row.pay_date);
			if (!isNaN(d.getTime())) {
				const pd = d.getDate().toString().padStart(2, "0");
				const pm = (d.getMonth() + 1).toString().padStart(2, "0");
				const py = d.getFullYear() + 543;
				payDate = `${pd}/${pm}/${py}`;
			}
		}
		doc.text("วันที่ทำรายการ/Date", 75, finalY + 22);
		doc.text(payDate, 108, finalY + 22);
		doc.text("...............................................", 108, finalY + 22.5);

		// Text Amount Box
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(13);
		doc.text("จำนวนเงิน /Amount", 10, finalY + 33);
		doc.text(
			netAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
			55,
			finalY + 33
		);

		doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
		doc.rect(40, finalY + 38, 100, 10);
		doc.text("ตัวอักษร", 10, finalY + 44);
		doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
		doc.text(`( ${toThaiBaht(netAmount)} )`, 90, finalY + 44, { align: "center" });
		doc.setTextColor(0, 0, 0);

		// Signatures
		const sigY = finalY + 55;
		doc.setDrawColor(0, 0, 0);
		doc.rect(10, sigY, 188, 30);
		doc.line(72, sigY, 72, sigY + 30);
		doc.line(135, sigY, 135, sigY + 30);

		doc.setFont("THSarabunNew", "normal");
		doc.text("ลูกค้า/ผู้อนุมัติ", 41, sigY + 5, { align: "center" });
		doc.text("ผู้ผลิต", 103, sigY + 5, { align: "center" });

		// Remove "บริษัท" and "จำกัด" (including potential decomposed vowel forms)
		const bus_name = (businessData?.bus_name || "")
			.replace(/บริษัท/g, "")
			.replace(/จำกัด|จํากัด/g, "") // Standard and Decomposed
			.trim();

		doc.text(bus_name, 166, sigY + 5, { align: "center" });

		doc.text("วันที่ ...........................................", 25, sigY + 25);
		doc.text("วันที่ ...........................................", 85, sigY + 25);
		doc.text("ผู้มีอำนาจลงนาม", 166, sigY + 25, { align: "center" });

		const remark = row.remark || "";
		if (remark) {
			const remarkLines = doc.splitTextToSize(remark, 180);
			doc.text(remarkLines, 10, sigY + 40);

			// Footer Remarks
			doc.setTextColor(255, 0, 0);
			doc.setFont("THSarabunNew", "normal");
			doc.text("**หมายเหตุ : Remark", 10, sigY + 35);

			doc.setTextColor(0, 0, 0);
			doc.setFont("THSarabunNew", "normal");
			doc.setFontSize(10);
		}
	};

	// Render Document
	renderHeader();
	renderSectionBoxes();

	// Table
	const tableData = products.map((item, index) => {
		// Find product in master list if name is missing
		const productDef = productQuery?.find(
			(p) => p.productID === item.productID || p.productname === item.productID
		);
		const productName = item.productName || item.productname || productDef?.productname || "";
		const unitPrice = parseFloat(
			item.price || productDef?.price || item.sale_price / item.sale_qty || 0
		);

		return [
			index + 1,
			productName +
				(item.description || item.product_detail
					? "\n" + (item.description || item.product_detail)
					: ""),
			parseFloat(item.sale_qty).toLocaleString(),
			unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 }),
			parseFloat(item.sale_price).toLocaleString("en-US", { minimumFractionDigits: 2 }),
		];
	});

	autoTable(doc, {
		startY: 100,
		head: [["ลำดับที่", "รายการ", "จำนวน", "ราคา/หน่วย", "จำนวนเงิน"]],
		body: tableData,
		theme: "grid",
		styles: {
			font: "THSarabunNew",
			fontSize: 13,
			cellPadding: 2,
			halign: "center",
			valign: "middle",
		},
		headStyles: {
			fillColor: [255, 255, 255],
			textColor: [0, 0, 0],
			lineWidth: 0.1,
			halign: "center",
			font: "THSarabunNew",
			fontStyle: "normal",
		},
		columnStyles: {
			0: { cellWidth: 15 },
			1: { cellWidth: 95, halign: "left" },
			2: { cellWidth: 20 },
			3: { cellWidth: 28, halign: "right" },
			4: { cellWidth: 30, halign: "right" },
		},
		margin: { left: 10, right: 10 },
		tableLineColor: blueColor,
		tableLineWidth: 0.1,
	});

	renderFooter(doc.lastAutoTable.finalY);

	if (action === "download") {
		doc.save(`${row.billing || "billing"}.pdf`);
	} else {
		const pdfBlob = doc.output("blob");
		const url = URL.createObjectURL(pdfBlob);
		setPdfUrl(url);
		setShowPdfModal(true);
	}
};
