import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import TableList from "@component/table-list";
import { config } from "@constant";
import { generatePDF as generatePDFService } from "./generate-pdf";
import InvoiceFormModal from "@module/invoice/invoice-form";
import DeleteModal from "@module/invoice/delete-modal";
import PDFModal from "@module/invoice/pdf-modal";
import SearchForm from "@module/invoice/search-form";

const Invoice = () => {
	const queryClient = useQueryClient();

	// Modal States
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [idEditing, setIdEditing] = useState(null);
	const [editingItem, setEditingItem] = useState(null);

	// PDF State
	const [pdfUrl, setPdfUrl] = useState(null);
	const [showPdfModal, setShowPdfModal] = useState(false);

	// Delete State
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [deleteId, setDeleteId] = useState(null);

	// Search State
	const [searchCriteria, setSearchCriteria] = useState({
		documentDate: "",
		documentNumber: "",
		customerName: "",
		status: "",
	});

	// Data Fetching
	const { data: getInvoiceData } = useQuery({
		queryKey: ["invoices"],
		queryFn: async () => {
			const res = await fetch(`${config.url}/Invoice/getInvoice`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
			});
			if (!res.ok) throw new Error("Failed to fetch invoices");
			const json = await res.json();
			return json.data;
		},
	});

	const { data: customerQuery } = useQuery({
		queryKey: ["customers"],
		queryFn: async () => {
			const res = await fetch(`${config.url}/quotation/getCustomer`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
			});
			if (!res.ok) throw new Error("Failed to fetch customers");
			const json = await res.json();
			return json.data;
		},
	});

	const { data: productQuery } = useQuery({
		queryKey: ["products"],
		queryFn: async () => {
			const res = await fetch(`${config.url}/product/getProduct`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
			});
			if (!res.ok) throw new Error("Failed to fetch products");
			const json = await res.json();
			return json.data;
		},
	});

	const { data: businessQuery } = useQuery({
		queryKey: ["business-quotation"],
		queryFn: async () => {
			const res = await fetch(`${config.url}/quotation/getBusinessByID`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
			});
			if (!res.ok) throw new Error("Failed to fetch business info");
			const json = await res.json();
			return json.data;
		},
	});

	// Derived Data
	const invoiceData = React.useMemo(() => {
		if (!getInvoiceData) return [];

		let data = getInvoiceData.flatMap((q) => q); // Ensure array

		if (searchCriteria.documentDate) {
			data = data.filter((item) => {
				if (!item.invoice_date) return false;
				return item.invoice_date.startsWith(searchCriteria.documentDate);
			});
		}

		if (searchCriteria.documentNumber) {
			data = data.filter((item) =>
				(item.invoice_number || "")
					.toLowerCase()
					.includes(searchCriteria.documentNumber.toLowerCase())
			);
		}

		if (searchCriteria.customerName) {
			data = data.filter((item) =>
				(item.cus_name || "").toLowerCase().includes(searchCriteria.customerName.toLowerCase())
			);
		}

		if (searchCriteria.status) {
			data = data.filter((item) => item.status === searchCriteria.status);
		}

		return data;
	}, [getInvoiceData, searchCriteria]);

	console.log("invoiceData", invoiceData);

	// Actions
	const handleClosePopup = () => {
		setIsPopupOpen(false);
		setEditingItem(null);
	};

	// Mutations
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const res = await fetch(`${config.url}/Invoice/deleteInvoice/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("@accessToken")}`,
				},
			});
			if (!res.ok) throw new Error("Failed to delete invoice");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries(["invoices"]);
			setShowDeleteModal(false);
			alert("ลบข้อมูลสำเร็จ");
		},
		onError: (error) => {
			alert("เกิดข้อผิดพลาดในการลบข้อมูล: " + error.message);
		},
	});

	// Handlers
	const handleAdd = () => {
		setEditingItem(null);
		setIsEditMode(false);
		setIsPopupOpen(true);
	};

	const handleEdit = (item) => {
		setEditingItem(item);
		setIdEditing(item.invoice_id);
		setIsEditMode(true);
		setIsPopupOpen(true);
	};

	const handleDelete = (item) => {
		setDeleteId(item.invoice_id);
		setShowDeleteModal(true);
	};

	const confirmDelete = () => {
		if (deleteId) {
			deleteMutation.mutate(deleteId);
		}
	};

	// PDF Generation
	const generatePDF = (action, row) => {
		generatePDFService(action, row, businessQuery, productQuery, setPdfUrl, setShowPdfModal);
	};

	return (
		<div className="container-fluid p-4">
			<div className="align-items-center mb-4 w-full">
				<h2>ใบแจ้งหนี้</h2>
			</div>

			<div className="card shadow-sm border-0">
				<div className="card-body">
					<div className="d-flex justify-content-end mb-3">
						<button className="btn btn-primary" onClick={handleAdd}>
							<i className="mdi mdi-plus me-1"></i> เพิ่มรายการ
						</button>
					</div>

					{/* Search Form */}
					<div className="mb-4">
						<SearchForm onSearch={setSearchCriteria} />
					</div>

					<TableList
						initialTableData={invoiceData}
						tableHeaders={[
							{
								label: "วันที่เอกสาร",
								key: "invoice_date",
								align: "center",
								render: (val) => {
									return val ? moment(val).add(543, "year").format("DD/MM/YYYY") : "";
								},
							},
							{ label: "เลขที่เอกสาร", key: "invoice_number", align: "center" },
							{ label: "ลูกค้า", key: "cus_name" },
							{
								label: "ประเภทภาษี",
								key: "vatType",
								align: "center",
								render: (val) =>
									val === "non-vat" ? "ไม่มีภาษี" : val === "included-vat" ? "รวมภาษี" : "แยกภาษี",
							},
							{
								label: "ยอดสุทธิ",
								key: "sale_totalprice",
								align: "center",
								render: (val) => `${parseFloat(val).toLocaleString()} บาท`,
							},
							{
								label: "สถานะ",
								key: "status",
								align: "center",
								render: (val) => {
									if (val === "Invoiced") {
										return <span className="badge bg-warning">รอชำระ</span>;
									} else if (val === "Billed") {
										return <span className="badge bg-success">ออกใบเสร็จแล้ว</span>;
									} else {
										return <span className="badge bg-secondary">-</span>;
									}
								},
							},
						]}
						columnEditAndDelete={true}
						columnforExport={true} // For Preview/Download
						onEdit={handleEdit}
						onDelete={handleDelete}
						onPreview={(item) => generatePDF("preview", item)}
						onExport={(item) => generatePDF("download", item)}
						itemsPerPage={10}
					/>
				</div>
			</div>

			{/* Add/Edit Modal */}
			{isPopupOpen && (
				<InvoiceFormModal
					isOpen={isPopupOpen}
					onClose={handleClosePopup}
					idEditing={idEditing}
					isEditMode={isEditMode}
					initialData={editingItem}
					customerOptions={customerQuery}
					productOptions={productQuery}
					businessData={businessQuery}
				/>
			)}

			{/* Delete Confirmation Modal */}
			<DeleteModal
				isOpen={showDeleteModal}
				onClose={() => setShowDeleteModal(false)}
				onConfirm={confirmDelete}
			/>

			{/* PDF Modal */}
			<PDFModal isOpen={showPdfModal} onClose={() => setShowPdfModal(false)} pdfUrl={pdfUrl} />
		</div>
	);
};

export default Invoice;
