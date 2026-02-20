import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import TableList from "@component/table-list";
import { config } from "@constant";
import { generatePDF as generatePDFService } from "./generate-pdf";
import QuotationFormModal from "@module/quotation/quotation-form";
import DeleteModal from "@module/quotation/delete-modal";
import PDFModal from "@module/quotation/pdf-modal";
import SearchForm from "@module/quotation/search-form";
import { useAlert } from "@component/alert/alert-context";
import { fetchApi } from "@utils/api";

const Quotation = () => {
	const queryClient = useQueryClient();
	const { success, error } = useAlert();

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
	const { data: getQuotationData } = useQuery({
		queryKey: ["quotations"],
		queryFn: async () => {
			const res = await fetchApi(`${config.url}/Quotation/getQuotation`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
			});
			if (!res.ok) throw new Error("Failed to fetch quotations");
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
		queryKey: ["business-quotation"],
		queryFn: async () => {
			const res = await fetchApi(`${config.url}/quotation/getBusinessByID`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
			});
			if (!res.ok) throw new Error("Failed to fetch business info");
			const json = await res.json();
			return json.data;
		},
	});

	// Derived Data
	const quotationData = React.useMemo(() => {
		if (!getQuotationData) return [];

		let data = getQuotationData.flatMap((q) => q); // Ensure array

		if (searchCriteria.documentDate) {
			data = data.filter((item) => {
				if (!item.quotation_start_date) return false;
				return item.quotation_start_date.startsWith(searchCriteria.documentDate);
			});
		}

		if (searchCriteria.documentNumber) {
			data = data.filter((item) =>
				(item.quotation_num || "")
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
	}, [getQuotationData, searchCriteria]);

	// Actions
	const handleClosePopup = () => {
		setIsPopupOpen(false);
		setEditingItem(null);
	};

	// Mutations
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const res = await fetchApi(`${config.url}/Quotation/deleteQuotation/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${localStorage.getItem("@accessToken")}`,
				},
			});
			if (!res.ok) throw new Error("Failed to delete quotation");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries(["quotations"]);
			setShowDeleteModal(false);
			success("ลบข้อมูลสำเร็จ");
		},
		onError: (err) => {
			error("เกิดข้อผิดพลาดในการลบข้อมูล: " + err.message, "ลบข้อมูลล้มเหลว");
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
		setIdEditing(item.sale_id);
		setIsEditMode(true);
		setIsPopupOpen(true);
	};

	const handleDelete = (item) => {
		setDeleteId(item.sale_id);
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
				<h2>ใบเสนอราคา</h2>
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
						initialTableData={quotationData}
						tableHeaders={[
							{
								label: "วันที่เอกสาร",
								key: "quotation_start_date",
								align: "center",
								render: (val) => {
									return val ? moment(val).add(543, "year").format("DD/MM/YYYY") : "";
								},
							},
							{ label: "เลขที่เอกสาร", key: "quotation_num", align: "center" },
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
									if (val === "Invoice") {
										return <span className="badge bg-warning">ออกใบแจ้งหนี้แล้ว</span>;
									} else if (val === "Billed") {
										return <span className="badge bg-success">ออกใบเสร็จแล้ว</span>;
									} else if (val === "Pending") {
										return <span className="badge bg-secondary">รอทำรายการ</span>;
									} else {
										return <span className="badge bg-secondary">{val}</span>;
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
				<QuotationFormModal
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

export default Quotation;
