import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TableList from "@component/table-list";
import { config } from "@constant";

const Customer = () => {
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [formData, setFormData] = useState({
		cus_id: "",
		cus_name: "",
		cus_address: "",
		cus_tel: "",
		cus_email: "",
		cus_tax: "",
		cus_purchase: "",
		cus_purchase_phone: "",
		cus_purchase_email: "",
		cus_purchase_remark: "",
		status: "active",
	});
	const [errors, setErrors] = useState({});

	const queryClient = useQueryClient();

	const { data: customers = [], isLoading } = useQuery({
		queryKey: ["customers"],
		queryFn: async () => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/Quotation/getCustomer`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await response.json();
			if (json.statusCode === 200) {
				return json.data;
			}
			throw new Error("Failed to fetch customers");
		},
	});

	const addMutation = useMutation({
		mutationFn: async (newData) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/Quotation/addCustomer`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(newData),
			});
			const json = await response.json();
			if (json.statusCode !== 200) {
				const error = new Error(json.data || "Failed to add customer");
				error.data = json.data;
				throw error;
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["customers"] });
			setIsPopupOpen(false);
			alert("เพิ่มข้อมูลสำเร็จ");
			resetForm();
		},
		onError: (error) => {
			let errorMsg = error.message;
			const errorData = error.data;

			if (typeof errorData === "string") {
				const newErrors = {};
				if (errorData.includes("tax")) {
					errorMsg = "เลขประจำตัวผู้เสียภาษีซ้ำ";
					newErrors.cus_tax = errorMsg;
				} else if (errorData.includes("Contact")) {
					errorMsg = "เบอร์โทรศัพท์ซ้ำ";
					newErrors.cus_tel = errorMsg;
				} else if (errorData.includes("Customer")) {
					errorMsg = "ชื่อลูกค้าซ้ำ";
					newErrors.cus_name = errorMsg;
				}
				setErrors((prev) => ({ ...prev, ...newErrors }));
			}
			alert("เกิดข้อผิดพลาด: " + errorMsg);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (updatedData) => {
			const token = localStorage.getItem("@accessToken");
			const cusID = updatedData.cus_id;
			const response = await fetch(`${config.url}/Quotation/editCustomer/${cusID}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(updatedData),
			});
			const json = await response.json();
			if (json.statusCode !== 200) {
				const error = new Error(json.data || "Failed to update customer");
				error.data = json.data;
				throw error;
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["customers"] });
			setIsPopupOpen(false);
			alert("แก้ไขข้อมูลสำเร็จ");
			resetForm();
		},
		onError: (error) => {
			let errorMsg = error.message;
			const errorData = error.data;

			if (typeof errorData === "string") {
				const newErrors = {};
				if (errorData.includes("tax")) {
					errorMsg = "เลขประจำตัวผู้เสียภาษีซ้ำ"; // validation.cus_tax_already
					newErrors.cus_tax = errorMsg;
				} else if (errorData.includes("Contact")) {
					errorMsg = "เบอร์โทรศัพท์ซ้ำ"; // validation.cus_name_Contact -> mapped to cus_tel in Vue
					newErrors.cus_tel = errorMsg;
				} else if (errorData.includes("Customer")) {
					errorMsg = "ชื่อลูกค้าซ้ำ"; // validation.cus_name_already
					newErrors.cus_name = errorMsg;
				}
				setErrors((prev) => ({ ...prev, ...newErrors }));
			}
			alert("เกิดข้อผิดพลาด: " + errorMsg);
		},
	});

	const resetForm = () => {
		setFormData({
			cus_id: "",
			cus_name: "",
			cus_address: "",
			cus_tel: "",
			cus_email: "",
			cus_tax: "",
			cus_purchase: "",
			cus_purchase_phone: "",
			cus_purchase_email: "",
			cus_purchase_remark: "",
			status: "active",
		});
		setErrors({});
		setIsEditMode(false);
	};

	const handleOpenAdd = () => {
		resetForm();
		setIsPopupOpen(true);
		setIsEditMode(false);
	};

	const handleClosePopup = () => {
		setIsPopupOpen(false);
		resetForm();
	};

	const deleteMutation = useMutation({
		mutationFn: async (cusId) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/Quotation/deleteCustomer/${cusId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const json = await response.json();
			if (json.statusCode !== 200) {
				throw new Error(json.message || "Failed to delete customer");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["customers"] });
			alert("ลบข้อมูลสำเร็จ");
		},
		onError: (error) => {
			alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
		},
	});

	const handleDelete = (item) => {
		const cusId = item.ID || item.cus_id;
		if (
			window.confirm(`คุณต้องการลบลูกค้า "${item["Customer Name"] || item.cus_name}" ใช่หรือไม่?`)
		) {
			deleteMutation.mutate(cusId);
		}
	};

	const handleEdit = (item) => {
		setFormData({
			cus_id: item.ID || item.cus_id,
			cus_name: item["Customer Name"] || item.cus_name,
			cus_address: item["Customer Address"] || item.cus_address,
			cus_tel: (item["Customer Tel"] || item.cus_tel || "").replace(/\D/g, ""),
			cus_email: item["Customer Email"] || item.cus_email,
			cus_tax: item["Customer Tax"] || item.cus_tax,
			cus_purchase: item["Purchase by"] || item.cus_purchase,
			cus_purchase_phone: (item["Purchase Phone"] || item.cus_purchase_phone || "").replace(
				/\D/g,
				""
			),
			cus_purchase_email: item["Purchase Email"] || item.cus_purchase_email,
			cus_purchase_remark: item["Purchase Remark"] || item.cus_purchase_remark,
			status: item.status || "active",
		});
		setIsPopupOpen(true);
		setIsEditMode(true);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
		if (errors[name]) {
			setErrors({ ...errors, [name]: null });
		}
	};

	const validateForm = () => {
		const newErrors = {};
		if (!formData.cus_name) newErrors.cus_name = "กรุณาระบุชื่อลูกค้า";
		if (!formData.cus_address) newErrors.cus_address = "กรุณาระบุที่อยู่";
		if (!formData.cus_tax) newErrors.cus_tax = "กรุณาระบุเลขผู้เสียภาษี";
		else if (formData.cus_tax.length !== 13) newErrors.cus_tax = "เลขผู้เสียภาษีต้องมี 13 หลัก";

		if (formData.cus_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.cus_email)) {
			newErrors.cus_email = "รูปแบบอีเมลไม่ถูกต้อง";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e) => {
		e.preventDefault(); // Prevent form submission
		if (!validateForm()) return;

		if (isEditMode) {
			updateMutation.mutate(formData);
		} else {
			addMutation.mutate(formData);
		}
	};

	return (
		<div className="container-fluid">
			<div className="align-items-center mb-4 w-full">
				<h2>ข้อมูลบริษัท/ลูกค้า</h2>
			</div>

			<div className="card shadow-sm border-0">
				<div className="card-body">
					<div className="d-flex justify-content-end mb-3">
						<button className="btn btn-success" onClick={handleOpenAdd}>
							<span className="mdi mdi-plus me-1"></span> เพิ่มลูกค้า
						</button>
					</div>
					{isLoading ? (
						<div className="text-center p-4">
							<div className="spinner-border text-primary" role="status">
								<span className="visually-hidden">Loading...</span>
							</div>
						</div>
					) : (
						<TableList
							initialTableData={customers}
							tableHeaders={[
								{ label: "ชื่อบริษัท/ลูกค้า", key: "cus_name", align: "left" },
								{ label: "ที่อยู่", key: "cus_address", align: "left" },
								{ label: "เบอร์โทรศัพท์", key: "cus_tel", align: "center" },
								{ label: "อีเมล", key: "cus_email", align: "center" },
							]}
							documentName="Customers"
							columnEditAndDelete
							showAllowButton={true}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					)}
				</div>
			</div>

			{isPopupOpen && (
				<div
					className="modal fade show d-block"
					style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
					tabIndex="-1"
				>
					<div className="modal-dialog modal-lg">
						<div className="modal-content">
							<div className="modal-header">
								<h5 className="modal-title">
									{isEditMode ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มข้อมูลลูกค้า"}
								</h5>
								<button type="button" className="btn-close" onClick={handleClosePopup}></button>
							</div>
							<div className="modal-body">
								<form onSubmit={handleSubmit}>
									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">
											<span className="text-danger me-1">*</span>ชื่อลูกค้า
										</label>
										<div className="col-sm-9">
											<input
												type="text"
												className={`form-control ${errors.cus_name ? "is-invalid" : ""}`}
												name="cus_name"
												value={formData.cus_name}
												onChange={handleChange}
											/>
											{errors.cus_name && <div className="invalid-feedback">{errors.cus_name}</div>}
										</div>
									</div>

									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">
											<span className="text-danger me-1">*</span>ที่อยู่
										</label>
										<div className="col-sm-9">
											<textarea
												className={`form-control ${errors.cus_address ? "is-invalid" : ""}`}
												name="cus_address"
												rows="2"
												value={formData.cus_address}
												onChange={handleChange}
											/>
											{errors.cus_address && (
												<div className="invalid-feedback">{errors.cus_address}</div>
											)}
										</div>
									</div>

									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">เบอร์โทรศัพท์</label>
										<div className="col-sm-9">
											<input
												type="text"
												className="form-control"
												name="cus_tel"
												maxLength="10"
												value={formData.cus_tel}
												onChange={(e) => {
													if (/^\d*$/.test(e.target.value)) handleChange(e);
												}}
											/>
										</div>
									</div>

									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">อีเมล</label>
										<div className="col-sm-9">
											<input
												type="email"
												className={`form-control ${errors.cus_email ? "is-invalid" : ""}`}
												name="cus_email"
												value={formData.cus_email}
												onChange={handleChange}
											/>
											{errors.cus_email && (
												<div className="invalid-feedback">{errors.cus_email}</div>
											)}
										</div>
									</div>

									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">
											<span className="text-danger me-1">*</span>เลขผู้เสียภาษี
										</label>
										<div className="col-sm-9">
											<input
												type="text"
												className={`form-control ${errors.cus_tax ? "is-invalid" : ""}`}
												name="cus_tax"
												maxLength="13"
												value={formData.cus_tax}
												onChange={(e) => {
													if (/^\d*$/.test(e.target.value)) handleChange(e);
												}}
											/>
											{errors.cus_tax && <div className="invalid-feedback">{errors.cus_tax}</div>}
										</div>
									</div>

									<hr />
									<h6 className="mb-3 text-primary">ข้อมูลผู้ติดต่อ (จัดซื้อ)</h6>

									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">ชื่อผู้ติดต่อ</label>
										<div className="col-sm-9">
											<input
												type="text"
												className="form-control"
												name="cus_purchase"
												value={formData.cus_purchase}
												onChange={handleChange}
											/>
										</div>
									</div>

									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">เบอร์โทรศัพท์ผู้ติดต่อ</label>
										<div className="col-sm-9">
											<input
												type="text"
												className="form-control"
												name="cus_purchase_phone"
												maxLength="10"
												value={formData.cus_purchase_phone}
												onChange={(e) => {
													if (/^\d*$/.test(e.target.value)) handleChange(e);
												}}
											/>
										</div>
									</div>

									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">อีเมลผู้ติดต่อ</label>
										<div className="col-sm-9">
											<input
												type="email"
												className="form-control"
												name="cus_purchase_email"
												value={formData.cus_purchase_email}
												onChange={handleChange}
											/>
										</div>
									</div>
								</form>
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-secondary" onClick={handleClosePopup}>
									ยกเลิก
								</button>
								<button type="button" className="btn btn-primary" onClick={handleSubmit}>
									{updateMutation.isPending || addMutation.isPending ? (
										<span
											className="spinner-border spinner-border-sm me-2"
											role="status"
											aria-hidden="true"
										></span>
									) : null}
									{isEditMode ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Customer;
