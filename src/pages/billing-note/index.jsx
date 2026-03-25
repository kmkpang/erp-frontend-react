import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import TableList from "@component/table-list";
import { config } from "@constant";
import { generatePDF as generatePDFService } from "./generate-pdf";
import BillingNoteFormModal from "@module/billing-note/billing-note-form";
import DeleteModal from "@module/billing-note/delete-modal";
import PDFModal from "@module/billing-note/pdf-modal";
import SearchForm from "@module/billing-note/search-form";
import { useAlert } from "@component/alert/alert-context";
import { fetchApi } from "@utils/api";

const BillingNote = () => {
	const queryClient = useQueryClient();
	const { success, error } = useAlert();

	// Modal States
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [idEditing, setIdEditing] = useState(null);
	const [editingItem, setEditingItem] = useState(null);
	const [showModeSelectionModal, setShowModeSelectionModal] = useState(false);
	const [requireCustomer, setRequireCustomer] = useState(true);

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
	});
	const [customerFilter, setCustomerFilter] = useState("with_customer");

	// Data Fetching
	const { data: getBillingData } = useQuery({
		queryKey: ["billings"],
		queryFn: async () => {
			const res = await fetchApi(`${config.url}/Billing/getBilling`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
			});
			if (!res.ok) throw new Error("Failed to fetch billings");
			const json = await res.json();
			return json.data;
		},
	});

	const { data: customerQuery } = useQuery({
		queryKey: ["customers"],
		queryFn: async () => {
			const res = await fetchApi(`${config.url}/quotation/getCustomer`, {
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
			const res = await fetchApi(`${config.url}/product/getProduct`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
			});
			if (!res.ok) throw new Error("Failed to fetch products");
			const json = await res.json();
			return json.data;
		},
	});

	const { data: businessQuery } = useQuery({
		queryKey: ["business"],
		queryFn: async () => {
			const res = await fetchApi(`${config.url}/quotation/getBusinessByID`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
			});
			if (!res.ok) throw new Error("Failed to fetch business info");
			const json = await res.json();
			return json.data;
		},
		staleTime: Infinity,
	});

	// Derived Data
	const billingData = React.useMemo(() => {
		if (!getBillingData) return [];

		let data = getBillingData.flatMap((billing) => billing);

		if (searchCriteria.documentDate) {
			data = data.filter((item) => {
				if (!item.billing_date) return false;
				return item.billing_date.startsWith(searchCriteria.documentDate);
			});
		}

		if (searchCriteria.documentNumber) {
			data = data.filter((item) =>
				(item.billing || "").toLowerCase().includes(searchCriteria.documentNumber.toLowerCase())
			);
		}

		if (searchCriteria.customerName) {
			data = data.filter((item) =>
				(item.cus_name || "").toLowerCase().includes(searchCriteria.customerName.toLowerCase())
			);
		}

		if (customerFilter === "with_customer") {
			data = data.filter((item) => !!item.cus_id || !!item.cus_name);
		} else if (customerFilter === "without_customer") {
			data = data.filter((item) => !item.cus_id && !item.cus_name);
		}

		return data;
	}, [getBillingData, searchCriteria, customerFilter]);

	// Actions
	const handleClosePopup = () => {
		setIsPopupOpen(false);
		setEditingItem(null);
	};

	// Mutations
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const res = await fetchApi(`${config.url}/Billing/deleteBilling/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("@accessToken")}`,
				},
			});
			if (!res.ok) throw new Error("Failed to delete billing");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries(["billings"]);
			setShowDeleteModal(false);
			success("ลบข้อมูลสำเร็จ");
		},
		onError: (err) => {
			error("เกิดข้อผิดพลาดในการลบข้อมูล: " + err.message, "ลบข้อมูลล้มเหลว");
		},
	});

	// Handlers
	const handleAdd = async () => {
		// Force refetch to ensure fresh data in multi-user environment
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["customers"] }),
			queryClient.invalidateQueries({ queryKey: ["products"] }),
			queryClient.invalidateQueries({ queryKey: ["business"] }),
		]);

		setEditingItem(null);
		setIsEditMode(false);
		setShowModeSelectionModal(true);
	};

	const handleEdit = async (item) => {
		// Force refetch for edit as well
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["customers"] }),
			queryClient.invalidateQueries({ queryKey: ["products"] }),
			queryClient.invalidateQueries({ queryKey: ["business"] }),
		]);

		setEditingItem(item);
		setIdEditing(item.billing_id);
		setIsEditMode(true);
		const hasCus = !!(
			item.cus_name ||
			item.cus_id ||
			item.cus_address ||
			item.cus_tel ||
			item.cus_tax
		);
		setRequireCustomer(hasCus);
		setIsPopupOpen(true);
	};

	const openFormWithMode = (mode) => {
		setShowModeSelectionModal(false);
		setRequireCustomer(mode === "with_customer");
		setCustomerFilter(mode);
		setIsPopupOpen(true);
	};

	const handleDelete = (item) => {
		setDeleteId(item.billing_id);
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
				<h2>ใบเสร็จรับเงิน/ใบกำกับภาษี</h2>
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

					{/* Customer Tabs */}
					<div className="d-flex mb-4" style={{ borderBottom: "1px solid #dee2e6" }}>
						<button
							className={`btn rounded-0 px-4 py-2 border-0 bg-transparent ${
								customerFilter === "with_customer" ? "text-primary fw-bold" : "text-muted"
							}`}
							style={{
								borderBottom:
									customerFilter === "with_customer"
										? "3px solid var(--bs-primary, #6f42c1) !important"
										: "3px solid transparent",
								marginBottom: "-1px",
								boxShadow: "none",
							}}
							onClick={() => setCustomerFilter("with_customer")}
						>
							มีข้อมูลลูกค้า
						</button>
						<button
							className={`btn rounded-0 px-4 py-2 border-0 bg-transparent ${
								customerFilter === "without_customer" ? "text-primary fw-bold" : "text-muted"
							}`}
							style={{
								borderBottom:
									customerFilter === "without_customer"
										? "3px solid var(--bs-primary, #6f42c1) !important"
										: "3px solid transparent",
								marginBottom: "-1px",
								boxShadow: "none",
							}}
							onClick={() => setCustomerFilter("without_customer")}
						>
							ไม่มีข้อมูลลูกค้า
						</button>
					</div>

					<TableList
						initialTableData={billingData}
						tableHeaders={[
							{
								label: "วันที่เอกสาร",
								key: "billing_date",
								align: "center",
								render: (val) => {
									return val ? moment(val).add(543, "year").format("DD/MM/YYYY") : "";
								},
							},
							{ label: "เลขที่เอกสาร", key: "billing", align: "center" },
							{
								label: "ลูกค้า",
								key: "cus_name",
								render: (val) => val || "-",
							},
							{
								label: "ประเภทภาษี",
								key: "vatType",
								align: "center",
								render: (val) =>
									val === "non-vat" ? "ไม่มีภาษี" : val === "included-vat" ? "รวมภาษี" : "แยกภาษี",
							},
							{
								label: "ประเภทการชำระ",
								key: "deposit_type",
								align: "center",
								render: (val) => (val === "full" ? "เต็มจำนวน" : val === "deposit" ? "มัดจำ" : "-"),
							},
							{
								label: "ยอดสุทธิ",
								key: "sale_totalprice",
								align: "center",
								render: (val) => `${parseFloat(val).toLocaleString()} บาท`,
							},
							{
								label: "ยอดมัดจำ",
								key: "deposit_amount",
								align: "center",
								render: (val) => (val ? `${parseFloat(val).toLocaleString()} บาท` : "-"),
							},
							{
								label: "อ้างอิงใบเสนอราคา",
								key: "quotation_num",
								align: "center",
								render: (val) => {
									if (val.includes("QT-AUTO")) return "-";
									return val || "-";
								},
							},
							{
								label: "อ้างอิงใบแจ้งหนี้",
								key: "invoice_number",
								align: "center",
								render: (val) => {
									if (val.includes("IV-AUTO")) return "-";
									return val || "-";
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

			{/* Mode Selection Modal */}
			{showModeSelectionModal && (
				<div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
					<div className="modal-dialog modal-md modal-dialog-centered">
						<div className="modal-content">
							<div className="modal-header">
								<h5 className="modal-title">เลือกรูปแบบการสร้างใบเสร็จรับเงิน</h5>
								<button
									type="button"
									className="btn-close"
									onClick={() => setShowModeSelectionModal(false)}
								></button>
							</div>
							<div className="modal-body d-flex flex-column gap-3 p-4">
								<button
									className="btn btn-outline-primary py-3 text-start"
									onClick={() => openFormWithMode("with_customer")}
								>
									<div className="fw-bold fs-5">แบบมีข้อมูลลูกค้า</div>
									<small>สร้างใบเสร็จรับเงินโดยการระบุข้อมูลลูกค้า</small>
								</button>
								<button
									className="btn btn-outline-primary py-3 text-start"
									onClick={() => openFormWithMode("without_customer")}
								>
									<div className="fw-bold fs-5">แบบไม่มีข้อมูลลูกค้า</div>
									<small>สร้างใบเสร็จรับเงินโดยไม่ระบุข้อมูลลูกค้า</small>
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Add/Edit Modal */}
			{isPopupOpen && (
				<BillingNoteFormModal
					isOpen={isPopupOpen}
					onClose={handleClosePopup}
					idEditing={idEditing}
					isEditMode={isEditMode}
					initialData={editingItem}
					customerOptions={customerQuery}
					productOptions={productQuery}
					requireCustomer={requireCustomer}
					onSaveSuccess={(data) => generatePDF("preview", data)}
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

export default BillingNote;
