import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
	const dateStr = row.sale_date || row.billing_date;
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
	const docNumber = row.quotation_num || "-";

	// Header Section
	const renderHeader = () => {
		// Logo
		if (businessData?.business?.bus_logo) {
			try {
				doc.addImage(businessData.business.bus_logo, "JPEG", 10, 10, 25, 20);
			} catch (e) {
				console.warn("Logo load failed", e);
			}
		}

		// Company Info
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(20);
		doc.text(businessData.business?.bus_name || "-", 40, 18);

		if (businessData.business?.bus_code === "00000") {
			doc.setFontSize(12);
			doc.text("(สำนักงานใหญ่)", 40, 24);
		}

		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(12);
		const addressLines = doc.splitTextToSize(businessData.business?.bus_address || "", 100);
		doc.text(addressLines, 10, 38);
		doc.text(`เลขประจำตัวผู้เสียภาษี  ${businessData.business?.bus_tax || "-"}`, 10, 51);
		doc.text(`โทร  ${formatPhoneNumber(businessData.business?.bus_tel) || "-"}`, 10, 56);

		// Title Box
		doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
		doc.setLineWidth(0.5);
		doc.rect(140, 10, 60, 20);
		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(16);
		doc.text("ใบเสนอราคา", 170, 20, { align: "center" });
		doc.setFontSize(10);
	};

	// Customer & Document Info
	const renderSectionBoxes = () => {
		// Customer Box
		doc.setDrawColor(orangeColor[0], orangeColor[1], orangeColor[2]);
		doc.rect(10, 60, 130, 35);

		doc.setFont("THSarabunNew", "normal");
		doc.setFontSize(12);
		doc.text("ชื่อลูกค้า / Customer:", 12, 65);
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
		doc.text(docNumber, 170, 78);
		doc.text(displayDate, 170, 88);
	};

	// Calculations for footer
	const price = parseFloat(row.sale_totalprice || row.total_price || 0);
	// Basic calculation logic same as BillingNote, assuming fields are consistent
	// Quotation usually excludes VAT until final total? Or depends on vatType.
	let finalTotal = price;
	let vatAmount = 0;
	let netAmount = price;

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
		doc.setFontSize(12);
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
		doc.setFontSize(12);
		doc.text(
			netAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
			198,
			finalY + 28,
			{ align: "right" }
		);

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
		doc.setFontSize(11);
		doc.text("ลูกค้า/ผู้อนุมัติ", 41, sigY + 5, { align: "center" });
		doc.text("ผู้ผลิต", 103, sigY + 5, { align: "center" });

		// Remove "บริษัท" and "จำกัด" (including potential decomposed vowel forms)
		let rawBusName = businessData.business.bus_name || "";

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
			fontSize: 11,
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
			fontStyle: "normal", // Explicitly set to normal as we only have normal weight
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
		doc.save(`${docNumber}.pdf`);
	} else {
		const pdfBlob = doc.output("blob");
		const url = URL.createObjectURL(pdfBlob);
		setPdfUrl(url);
		setShowPdfModal(true);
	}
};
