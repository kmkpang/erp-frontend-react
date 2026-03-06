import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Thai Baht Text Helper
const toThaiBaht = (number) => {
	if (!number || Number.isNaN(number)) return "ศูนย์บาทถ้วน";
	const numbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
	const scales = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
	let [integer, decimals] = Number.parseFloat(number).toFixed(2).split(".");
	let result = "";

	// Handle millions if number is very large
	const handlePart = (numStr) => {
		let partResult = "";
		for (let i = 0; i < numStr.length; i++) {
			let n = Number.parseInt(numStr[i]);
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

	if (Number.parseInt(integer) === 0) result = numbers[0];
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

	if (Number.parseInt(decimals) === 0) result += "ถ้วน";
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
		// Paths relative to this file. Assuming font folder is at ../../font
		// This part depends on build system (Vite), dynamic import might need full path or alias
		// Using same imports as BillingNote
		// Paths relative to this file. Assuming font folder is at ../../font
		const thSarabunNew = (await import("../../font/THSarabunNew-normal.js")).default;

		doc.addFileToVFS("THSarabunNew.ttf", thSarabunNew);
		doc.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
	} catch (error) {
		console.error("Error loading fonts:", error);
	}

	const products = row.productForms || row.products || row.details || []; // Handle different data structures

	// Date Formatting
	// Prefer sale_date, fallback to billing_date
	const dateStr = row.quotation_start_date || row.sale_date || row.billing_date;
	let billingDate = new Date();
	if (dateStr) {
		billingDate = new Date(dateStr);
		if (isNaN(billingDate.getTime())) billingDate = new Date();
	}
	const day = billingDate.getDate().toString().padStart(2, "0");
	const month = (billingDate.getMonth() + 1).toString().padStart(2, "0");
	const buddhistYear = billingDate.getFullYear() + 543;
	const displayDate = `${day}/${month}/${buddhistYear}`;

	// Document Number
	const docNumber = row.quotation_num || row.sale_number || "-";

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
		const email = bData?.bus_email
			? `      E-mail : ${bData.bus_email}`
			: "";
		doc.text(`โทร  ${tel}${email}`, 10, 56);

		// Title Box
		doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
		doc.setLineWidth(0.5);
		doc.rect(140, 10, 60, 20);
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(18);
		doc.text("ใบเสนอราคา", 170, 22, { align: "center" });
		doc.setFontSize(10);
	};

	// Customer & Document Info
	const renderSectionBoxes = () => {
		// Customer Box
		doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
		doc.rect(10, 60, 130, 45);

		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(14);
		doc.text("ชื่อลูกค้า / Customer:", 12, 65);
		doc.text("ที่อยู่ / Address:", 12, 75);
		doc.text("เบอร์โทรศัพท์", 12, 85);
		doc.text("เลขประจำตัวผู้เสียภาษี", 12, 95);

		doc.setFont("THSarabunNew", "normal");
		doc.text(row.cus_name || "-", 45, 65);
		const cusAddressLines = doc.splitTextToSize(row.cus_address || "-", 98);
		doc.text(cusAddressLines, 45, 75);
		doc.text(formatPhoneNumber(row.cus_tel) || "-", 45, 85);
		doc.text(row.cus_tax || "-", 45, 95);

		// Billing Info Box
		doc.rect(142, 60, 58, 45);
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(14);
		doc.text("เลขที่ / No.", 145, 75);
		doc.text("วันที่ / Date", 145, 85);

		doc.setFont("THSarabunNew", "normal");
		doc.text(docNumber, 170, 75);
		doc.text(displayDate, 170, 85);
	};

	// Calculations for footer
	const calculateInitialPrice = () => {
		let p = parseFloat(row.sale_totalprice || row.total_price || row.total_grand || 0);
		if (p === 0 && products && products.length > 0) {
			p = products.reduce((sum, item) => sum + (parseFloat(item.sale_price) || 0), 0);
		}
		return p;
	};

	const price = calculateInitialPrice();
	// Basic calculation logic same as BillingNote, assuming fields are consistent
	// Quotation usually excludes VAT until final total? Or depends on vatType.
	let finalTotal = price;
	let vatAmount = 0;
	let netAmount = price;

	const isIncludedVat = row.vatType === "included-vat";

	if (row.vatType === "included-vat") {
		// Price includes VAT: show ex-VAT as subtotal
		vatAmount = (price * 7) / 107;
		finalTotal = price - vatAmount; // ex-VAT total
		netAmount = price; // full amount (customer pays this)
	} else if (row.vatType === "excluded-vat") {
		// Price excludes VAT
		finalTotal = price;
		vatAmount = price * 0.07;
		netAmount = price + vatAmount;
	}

	const renderFooter = (lastY) => {
		let finalY = lastY + 2;
		const summaryX = 142;
		const summaryW = 58;

		const pageHeight = doc.internal.pageSize.getHeight();
		// Quotation footer is somewhat tall because of remarks and rules (~110 units)
		if (finalY + 110 > pageHeight) {
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
		doc.setFontSize(14);
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
			netY + 10,
			{ align: "right" }
		);

		// Text Amount Box
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(14);
		doc.setTextColor(0, 0, 0);

		doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
		doc.rect(40, netY + 7, 95, 10);
		doc.text("ตัวอักษร", 10, netY + 13);
		doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
		doc.text(`( ${toThaiBaht(netAmount)} )`, 87.5, netY + 14, { align: "center" });
		doc.setTextColor(0, 0, 0);

		// Signatures
		const sigY = finalY + 45; // Moved up slightly as Payment section might be different or removed

		// For Quotation, we usually have "Prepare By", "Approved By", "Customer Accept"
		// BillingNote had "Customer/Approver", "Producer", "Authorized"
		// I'll keep the layout but maybe adjust labels if strictly defined?
		// User said "Everything is same". I'll keep it.

		doc.setDrawColor(0, 0, 0);
		doc.rect(10, sigY, 188, 30);
		doc.line(72, sigY, 72, sigY + 30);
		doc.line(135, sigY, 135, sigY + 30);

		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(14);
		doc.text("ลูกค้า/ผู้รับสินค้า", 41, sigY + 5, { align: "center" });
		doc.text("ผู้เสนอ", 103, sigY + 5, { align: "center" });

		// Remove "บริษัท" and "จำกัด" (including potential decomposed vowel forms)
		let rawBusName = bData.bus_name || "";

		const bus_name = rawBusName
			.replace(/บริษัท/g, "")
			.replace(/จำกัด|จํากัด/g, "") // Standard and Decomposed
			.trim();

		doc.text(bus_name, 166, sigY + 5, { align: "center" }); // Customer signs here to accept

		doc.text("วันที่ ...........................................", 25, sigY + 25);
		doc.text("วันที่ ...........................................", 85, sigY + 25);
		doc.text("ผู้มีอำนาจลงนาม", 155, sigY + 25);

		// Footer Remarks
		doc.setTextColor(255, 0, 0);
		doc.setFont("THSarabunNew", "normal");
		doc.text("**หมายเหตุ : Remark", 10, sigY + 35);

		doc.setTextColor(0, 0, 0);
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(10);

		const remark = row.remark || "";
		if (remark) {
			const remarkLines = doc.splitTextToSize(remark, 180);
			doc.text(remarkLines, 10, sigY + 40);
		} else {
			// Fallback if no remark is present (matches default form state)
			doc.text("1. ราคาทีเสนอเป็นเงินบาทไทย", 10, sigY + 40);
			doc.text(
				"2. มัดจำค่าสินค้า 60% ส่วนที่เหลือชําระทั้งหมดในวันส่งของ หรือ ติดตังแล้วเสร็จ",
				10,
				sigY + 44
			);
			doc.text(
				"3. ระยะเวลาดําเนินการ 2-3 วัน หลังจากได้รับ มัดจํา หรือระยะเวลาขึน อยู่กับปริมาณสินค้าทีลูกค้าสังซือ หรือตามเงือนไขอื่นๆ ตามที่ตกลงกัน",
				10,
				sigY + 48
			);

			const bankInfo = businessData.business?.banks?.[0] || {};
			if (bankInfo.bank_name) {
				const bankStr = `4. โอนเงินชําระค่าสินค้า ที่ ธนาคาร${bankInfo.bank_name} ( ${bankInfo.bank_account || ""} ) ${bankInfo.bank_number || ""}`;
				doc.text(bankStr, 10, sigY + 52);
			}
		}
	};

	// We will draw headers dynamically on each page loop (didDrawPage)
	// so they repeat correctly if the table is long
	// Table

	const tableData = products.map((item, index) => {
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
		const lineTotal = isIncludedVat
			? unitPrice * qty          // ex-VAT total
			: salePrice;               // original sale_price

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

	autoTable(doc, {
		startY: 110,
		head: [["ลำดับที่", "รายการ", "จำนวน", "ราคา/หน่วย", "จำนวนเงิน"]],
		body: tableData,
		theme: "grid",
		styles: {
			font: "THSarabunNew",
			fontSize: 14,
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
		doc.save(`${docNumber}.pdf`);
	} else {
		const pdfBlob = doc.output("blob");
		const url = URL.createObjectURL(pdfBlob);
		setPdfUrl(url);
		setShowPdfModal(true);
	}
};
