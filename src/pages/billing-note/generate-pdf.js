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

	const bData = businessData?.business || businessData || {};

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
		if (bData?.bus_logo) {
			try {
				doc.addImage(bData.bus_logo, "JPEG", 10, 10, 25, 20);
			} catch (e) {
				console.warn("Logo load failed", e);
			}
		}

		// Company Info
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(22);
		doc.text(bData?.bus_name || "-", 55, 18);

		if (bData?.bus_code === "00000") {
			doc.setFontSize(14);
			doc.text("(สำนักงานใหญ่)", 55, 24);
		}

		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(14);
		const addressLines = doc.splitTextToSize(bData?.bus_address || "", 100);
		doc.text(addressLines, 10, 38);
		doc.text(`เลขประจำตัวผู้เสียภาษี  ${bData?.bus_tax || "-"}`, 10, 51);
		const tel = formatPhoneNumber(bData?.bus_tel) || "-";
		const email = bData?.bus_email ? `      E-mail : ${bData.bus_email}` : "";
		doc.text(`โทร  ${tel}${email}`, 10, 56);

		// Title Box
		doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
		doc.setLineWidth(0.5);
		doc.rect(140, 10, 60, 20);
		doc.setFont("THSarabunNew", "normal");
		const titleText = row.doc_title || "ใบเสร็จรับเงิน/ใบกำกับภาษี";
		if (titleText === "ใบเสร็จรับเงิน/ใบกำกับภาษีอย่างย่อ") {
			doc.setFontSize(16);
		} else {
			doc.setFontSize(18);
		}
		doc.text(titleText, 170, 22, { align: "center" });

		// Original mark
		doc.setTextColor(255, 0, 0);
		doc.setFontSize(18);
		doc.text("ต้นฉบับ", 170, 50, { align: "center" });
		doc.setTextColor(0, 0, 0);
	};

	// Customer & Document Info
	const renderSectionBoxes = () => {
		// Calculate the Reference (Invoice or Quotation)
		let referenceText = "-";
		let referenceLabel = "";
		if (row.invoice_number && !row.invoice_number.includes("IV-AUTO")) {
			referenceLabel = "ใบแจ้งหนี้";
			referenceText = row.invoice_number;
		} else if (row.quotation_num && !row.quotation_num.includes("QT-AUTO")) {
			referenceLabel = "ใบเสนอราคา";
			referenceText = row.quotation_num;
		}

		const hasCustomerInfo = row.cus_name || row.cus_address || row.cus_tel || row.cus_tax;

		if (hasCustomerInfo) {
			// Customer Box
			doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
			doc.setLineWidth(0.2);
			doc.rect(10, 60, 130, 45);

			doc.setFont("THSarabunNew", "normal");
			doc.setFontSize(14);
			doc.text("ชื่อลูกค้า / Customers:", 12, 65);
			doc.text("ที่อยู่ / Address:", 12, 75);
			doc.text("เบอร์โทรศัพท์", 12, 85);
			doc.text("เลขประจำตัวผู้เสียภาษี", 12, 95);

			doc.setFont("THSarabunNew", "normal");
			doc.text(row.cus_name || "-", 45, 65);
			const cusAddressLines = doc.splitTextToSize(row.cus_address || "-", 90);
			doc.text(cusAddressLines, 45, 75);
			doc.text(formatPhoneNumber(row.cus_tel) || "-", 45, 85);
			doc.text(row.cus_tax || "-", 45, 95);
		}

		// Billing Info Box
		doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
		doc.setLineWidth(0.2);
		doc.rect(142, 60, 58, 45);
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(14); // Ensure correct font size even if customer block was skipped
		doc.text("เลขที่ / No.", 145, 75);
		doc.text("วันที่ / Date", 145, 85);
		doc.text("อ้างอิง / Ref.", 145, 95);

		doc.setFont("THSarabunNew", "normal");
		const docNumber = row.billing || row.billing_number || "-";
		doc.text(docNumber, 170, 75);
		doc.text(displayDate, 170, 85);
		doc.text(`${referenceLabel} ${referenceText}`, 145, 100);
	};

	// Calculations for footer
	const calculateInitialPrice = () => {
		if (row.deposit_type === "deposit" && parseFloat(row.deposit_amount) > 0) {
			return parseFloat(row.deposit_amount);
		}
		// คำนวณจาก products โดยตรงก่อน (เหมือนฟอร์ม) เพื่อป้องกันความคลาดเคลื่อนจาก sale_totalprice ใน DB
		let p = 0;
		if (products && products.length > 0) {
			p = products.reduce((sum, item) => sum + (parseFloat(item.sale_price) || 0), 0);
		}
		// Fallback ไป sale_totalprice ถ้า products ไม่มีข้อมูล
		if (p === 0) {
			p = parseFloat(row.sale_totalprice || row.total_price || row.total_grand || 0);
		}
		// If this is a full billing but there were prior deposits, subtract them
		const totalDeposited = parseFloat(row.total_deposited) || 0;
		if (row.deposit_type !== "deposit" && totalDeposited > 0) {
			return p - totalDeposited;
		}
		return p;
	};

	const price = calculateInitialPrice();
	let finalTotal = price; // รวมเงิน (Total / Subtotal)
	let vatAmount = 0;
	let netAmount = price; // ยอดเงินสุทธิ (Net Amount)

	const isIncludedVat = row.vatType === "included-vat";

	// ใช้ grand_total ที่คำนวณและเก็บไว้แล้วจากฟอร์ม (ถ้ามี) เพื่อป้องกันความคลาดเคลื่อนของทศนิยม
	const storedGrandTotal = parseFloat(row.grand_total) || 0;
	const storedVat = parseFloat(row.vat) || 0;

	if (row.vatType === "included-vat") {
		// Price includes VAT: show ex-VAT as subtotal
		vatAmount = storedVat > 0 ? storedVat : (price * 7) / 107;
		finalTotal = price - vatAmount; // ex-VAT total
		netAmount = storedGrandTotal > 0 ? storedGrandTotal : price; // full amount (customer pays this)
	} else if (row.vatType === "excluded-vat") {
		// Price excludes VAT
		finalTotal = price;
		vatAmount = storedVat > 0 ? storedVat : price * 0.07;
		netAmount = storedGrandTotal > 0 ? storedGrandTotal : price + vatAmount;
	}

	// Manual rounding adjustment for HDIN2603-08
	if (row.invoice_number === "HDIN2603-08" || row.billing === "HDIN2603-08" || row.billing_number === "HDIN2603-08") {
		netAmount = Math.round(netAmount);
	}

	const renderFooter = (lastY) => {
		let finalY = lastY + 2;
		const summaryX = 142;
		const summaryW = 58;

		const pageHeight = doc.internal.pageSize.getHeight();
		// Billing note footer is quite tall due to payment details & signatures (~105 units)
		if (finalY + 105 > pageHeight) {
			doc.addPage();
			renderHeader();
			renderSectionBoxes();
			finalY = 110;
		}

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
		const netY = finalY + 20;

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
		doc.rect(summaryX, netY, 30, 15, "F"); // Label bg
		doc.rect(summaryX, netY, summaryW, 15); // Outline

		doc.setFont("THSarabunNew", "normal");
		doc.text("ยอดเงินสุทธิ", summaryX + 2, netY + 6);
		doc.text("NET AMOUNT", summaryX + 2, netY + 12);
		doc.setFontSize(16);
		doc.text(
			netAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
			198,
			netY + 8,
			{ align: "right" }
		);

		// Payment Section (Left side)
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(14);
		doc.setTextColor(0, 0, 0);

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
		doc.text(payDate, 105, finalY + 22);
		doc.text("...............................................", 103, finalY + 22.5);

		// Text Amount Box
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(14);
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
		doc.text("ลูกค้า/ผู้ชำระเงิน", 41, sigY + 5, { align: "center" });
		doc.text("ผู้รับเงิน", 103, sigY + 5, { align: "center" });

		// Remove "บริษัท" and "จำกัด" (including potential decomposed vowel forms)
		const bus_name = (bData?.bus_name || "")
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
	let tableData = [];

	if (row.deposit_type === "deposit") {
		const origTotal = parseFloat(row.sale_totalprice || row.total_price || row.total_grand || 0) || products.reduce((sum, item) => sum + (parseFloat(item.sale_price) || 0), 0);
		const depositAmt = parseFloat(row.deposit_amount) || 0;
		const pct = origTotal > 0 ? Math.round((depositAmt / origTotal) * 100) : 0;

		let refText = "";
		if (row.quotation_num && !row.quotation_num.includes("QT-AUTO")) {
			refText = `\n**รายละเอียดงานตามใบเสนอราคาเลขที่ ${row.quotation_num}`;
		}

		let description = `มัดจำค่าติดตั้งป้าย ${pct}% ก่อนเริ่มงาน`;

		products.forEach(item => {
			const productDef = productQuery?.find(
				(p) => p.productID === item.productID || p.productname === item.productname
			);
			const pName = item.productName || item.productname || productDef?.productname || "";
			const pPrice = parseFloat(item.sale_price || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });
			description += `\n${pName}                                ${pPrice}`;
		});
		description += `\n\nรวมราคาตามใบเสนอราคา                 ${origTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
		description += refText;

		tableData = [
			[
				1,
				description,
				"1",
				depositAmt.toLocaleString("en-US", { minimumFractionDigits: 2 }),
				depositAmt.toLocaleString("en-US", { minimumFractionDigits: 2 }),
			]
		];
	} else {
		const totalDeposited = parseFloat(row.total_deposited) || 0;

		tableData = products.map((item, index) => {
			// Find product in master list if name is missing
			const productDef = productQuery?.find(
				(p) => p.productID === item.productID || p.productname === item.productID
			);
			const productName = item.productName || item.productname || productDef?.productname || "";
			const salePrice = parseFloat(item.sale_price) || 0;
			const qty = parseFloat(item.sale_qty) || 1;

			let unitPrice;
			if (isIncludedVat) {
				unitPrice = (salePrice / qty) / 1.07;
			} else {
				unitPrice = parseFloat(item.price || productDef?.price || salePrice / qty || 0);
			}
			const lineTotal = isIncludedVat ? unitPrice * qty : salePrice;

			return [
				index + 1,
				productName +
				(item.description || item.product_detail
					? "\n" + (item.description || item.product_detail)
					: ""),
				qty.toLocaleString(),
				unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 }),
				lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 }),
			];
		});

		// If prior deposit invoices exist, add a deduction row
		if (totalDeposited > 0) {
			let depositRefText = "หักค่ามัดจำ";
			if (row.invoice_number && !row.invoice_number.includes("IV-AUTO")) {
				depositRefText += ` (ตามใบแจ้งหนี้ค่ามัดจำ: ${row.invoice_number})`;
			} else if (row.quotation_num && !row.quotation_num.includes("QT-AUTO")) {
				depositRefText += ` (QN: ${row.quotation_num})`;
			}
			tableData.push(["", depositRefText, "", "", `-${totalDeposited.toLocaleString("en-US", { minimumFractionDigits: 2 })}`]);
		}
	}

	autoTable(doc, {
		startY: 110,
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
			4: { cellWidth: 32, halign: "right" },
		},
		margin: { top: 110, left: 10, right: 10, bottom: 20 },
		didDrawPage: function () {
			renderHeader();
			renderSectionBoxes();
		},
		tableLineColor: blueColor,
		tableLineWidth: 0.1,
	});

	renderFooter(doc.lastAutoTable.finalY);

	const totalPages = doc.internal.getNumberOfPages();
	if (totalPages > 1) {
		for (let i = 1; i <= totalPages; i++) {
			doc.setPage(i);
			doc.setFont("THSarabunNew", "normal");
			doc.setFontSize(12);
			doc.text(`หน้า ${i} / ${totalPages}`, 195, 15, { align: "right" });
		}
	}

	if (action === "download") {
		doc.save(`${row.billing || "billing"}.pdf`);
	} else {
		const pdfBlob = doc.output("blob");
		const url = URL.createObjectURL(pdfBlob);
		setPdfUrl(url);
		setShowPdfModal(true);
	}
};
