import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { config } from "@constant";
import "./About.css";

const About = () => {
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({});
	const [imageFile, setImageFile] = useState(null);
	const queryClient = useQueryClient();

	// Fetch business data
	const { data: businessData = {}, isLoading } = useQuery({
		queryKey: ["business"],
		queryFn: async () => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/Quotation/getBusinessByID`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await response.json();
			if (json.statusCode === 200 && json.data) {
				return json.data.business;
			}
			throw new Error("Failed to fetch business data");
		},
	});

	// Update business mutation
	const updateMutation = useMutation({
		mutationFn: async (data) => {
			const token = localStorage.getItem("@accessToken");
			const formDataBusiness = new FormData();

			// Append all business data
			formDataBusiness.append("bus_id", data.bus_id);
			formDataBusiness.append("bus_name", data.bus_name);
			formDataBusiness.append("bus_address", data.bus_address);
			formDataBusiness.append("bus_website", data.bus_website || "");
			formDataBusiness.append("bus_tel", data.bus_tel);
			formDataBusiness.append("bus_tax", data.bus_tax || "");
			formDataBusiness.append("file", imageFile || "");

			// Append bank data
			formDataBusiness.append("bank_name", data.banks?.[0]?.bank_name || "");
			formDataBusiness.append("bank_account", data.banks?.[0]?.bank_account || "");
			formDataBusiness.append("bank_number", data.banks?.[0]?.bank_number || "");
			formDataBusiness.append("bank_id", data.bank_id || "");

			const busID = data.bus_id;
			const response = await fetch(`${config.url}/Quotation/editBusiness/${busID}`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formDataBusiness,
			});

			const json = await response.json();
			if (json.statusCode !== 200) {
				throw new Error(json.data || "Failed to update business");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["business"] });
			setIsEditing(false);
			setImageFile(null);
			alert("บันทึกข้อมูลสำเร็จ");
		},
		onError: (error) => {
			alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`);
		},
	});

	const handleEdit = () => {
		setIsEditing(true);
		setFormData({ ...businessData });
	};

	const handleCancel = () => {
		setIsEditing(false);
		setFormData({ ...businessData });
		setImageFile(null);
	};

	const formatPhoneNumber = (phone) => {
		if (!phone || phone === "-") return "-";
		const cleaned = ("" + phone).replace(/\D/g, "");
		const match10 = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
		if (match10) {
			return `${match10[1]}-${match10[2]}-${match10[3]}`;
		}
		const match9 = cleaned.match(/^(\d{2})(\d{3})(\d{4})$/);
		if (match9) {
			return `${match9[1]}-${match9[2]}-${match9[3]}`;
		}
		return phone;
	};

	const validateFormData = () => {
		if (!formData.bus_name) {
			alert("กรุณาระบุชื่อธุรกิจ");
			return false;
		}
		if (!formData.bus_address) {
			alert("กรุณาระบุที่อยู่");
			return false;
		}

		// Validate Phone
		if (!formData.bus_tel) {
			alert("กรุณาระบุเบอร์โทรศัพท์");
			return false;
		}
		const phoneCleaned = formData.bus_tel.replace(/-/g, "");
		if (!/^\d{9,10}$/.test(phoneCleaned)) {
			alert("เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก");
			return false;
		}

		// Validate Tax ID
		if (formData.bus_tax) {
			const taxCleaned = formData.bus_tax.replace(/-/g, "");
			if (!/^\d{13}$/.test(taxCleaned)) {
				alert("เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก");
				return false;
			}
		}

		// Validate Bank Account
		const bankNumber = formData.banks?.[0]?.bank_number;
		if (bankNumber) {
			const bankCleaned = bankNumber.replace(/-/g, "");
			if (!/^\d{10,15}$/.test(bankCleaned)) {
				alert("เลขที่บัญชีต้องเป็นตัวเลข 10-15 หลัก");
				return false;
			}
		}

		return true;
	};

	const handleSave = () => {
		if (validateFormData()) {
			// Clean data before sending
			const cleanedData = {
				...formData,
				bus_tel: formData.bus_tel?.replace(/-/g, ""),
				bus_tax: formData.bus_tax?.replace(/-/g, ""),
				// Bank details are already in nested structure from handleChange
			};

			// Clean bank number if present
			if (cleanedData.banks?.[0]) {
				cleanedData.banks[0].bank_number = cleanedData.banks[0].bank_number?.replace(/-/g, "");
			}

			updateMutation.mutate(cleanedData);
		}
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		// Check if the field belongs to bank details
		if (["bank_name", "bank_account", "bank_number"].includes(name)) {
			// Create a new banks array with updated first element
			const currentBank = formData.banks?.[0] || {};
			const updatedBank = { ...currentBank, [name]: value };

			setFormData({
				...formData,
				banks: [updatedBank],
			});
		} else {
			setFormData({
				...formData,
				[name]: value,
			});
		}
	};

	const handleFileUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			setImageFile(file);
			// Create preview URL
			const reader = new FileReader();
			reader.onload = (event) => {
				setFormData({
					...formData,
					bus_logo: event.target.result,
				});
			};
			reader.readAsDataURL(file);
		}
	};

	if (isLoading) {
		return (
			<div className="container-fluid">
				<h2 className="mb-4">เกี่ยวกับธุรกิจ</h2>
				<div className="text-center p-5">
					<div className="spinner-border text-primary" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container-fluid">
			<h2 className="mb-4">เกี่ยวกับธุรกิจ</h2>

			<div className="about-container">
				<div className="about-card">
					{/* Business Name Header */}
					<div className="business-name-header">
						{isEditing ? (
							<div className="w-100">
								<label htmlFor="bus_name" className="form-label small text-muted">
									ชื่อธุรกิจ
								</label>
								<input
									id="bus_name"
									type="text"
									name="bus_name"
									className="form-control text-center fw-bold fs-4"
									value={formData.bus_name || ""}
									onChange={handleChange}
								/>
							</div>
						) : (
							<h3 className="fw-bold text-dark m-0">{businessData.bus_name || "-"}</h3>
						)}
					</div>

					{/* Content Row: Logo + Info */}
					<div className="content-row">
						{/* Logo Section */}
						<div className="logo-section">
							{(isEditing ? formData.bus_logo : businessData.bus_logo) ? (
								<img
									src={isEditing ? formData.bus_logo : businessData.bus_logo}
									alt="Business Logo"
									className="business-logo"
								/>
							) : (
								<div className="logo-placeholder">
									<span
										className="mdi mdi-domain"
										style={{ fontSize: "80px", color: "#ccc" }}
									></span>
								</div>
							)}
							{isEditing && (
								<label className="btn btn-sm btn-outline-primary mt-2 cursor-pointer">
									<span className="mdi mdi-camera"></span> เปลี่ยนโลโก้
									<input type="file" hidden accept="image/*" onChange={handleFileUpload} />
								</label>
							)}
						</div>

						{/* Business Information Section */}
						<div className="info-section">
							<div className="section-header">
								<h5 className="section-title">
									<span className="mdi mdi-information-outline"></span> Business Information
								</h5>
								{!isEditing && (
									<button className="btn btn-sm btn-outline-primary" onClick={handleEdit}>
										<span className="mdi mdi-pencil"></span> แก้ไข
									</button>
								)}
							</div>

							<div className="info-grid">
								{/* ที่อยู่ */}
								<div className="info-item full-width">
									<div className="info-label">ที่อยู่:</div>
									{isEditing ? (
										<textarea
											name="bus_address"
											className="form-control"
											value={formData.bus_address || ""}
											onChange={handleChange}
											rows={3}
										/>
									) : (
										<div className="info-value">{businessData.bus_address || "-"}</div>
									)}
								</div>

								{/* เว็บไซต์ */}
								<div className="info-item">
									<div className="info-label">เว็บไซต์:</div>
									{isEditing ? (
										<input
											type="text"
											name="bus_website"
											className="form-control"
											value={formData.bus_website || ""}
											onChange={handleChange}
										/>
									) : (
										<div className="info-value">{businessData.bus_website || "-"}</div>
									)}
								</div>

								{/* เบอร์โทรศัพท์ */}
								<div className="info-item">
									<div className="info-label">เบอร์โทรศัพท์:</div>
									{isEditing ? (
										<input
											type="text"
											name="bus_tel"
											className="form-control"
											value={formData.bus_tel || ""}
											onChange={handleChange}
										/>
									) : (
										<div className="info-value">{formatPhoneNumber(businessData.bus_tel)}</div>
									)}
								</div>

								{/* เลขประจำตัวผู้เสียภาษี */}
								<div className="info-item">
									<div className="info-label">เลขประจำตัวผู้เสียภาษี:</div>
									{isEditing ? (
										<input
											type="text"
											name="bus_tax"
											className="form-control"
											value={formData.bus_tax || ""}
											onChange={handleChange}
										/>
									) : (
										<div className="info-value">{businessData.bus_tax || "-"}</div>
									)}
								</div>
							</div>
							{/* Banking Details Section */}
							<div className="section-header mt-4">
								<h5 className="section-title">
									<span className="mdi mdi-bank"></span> Banking Details
								</h5>
							</div>

							<div className="info-grid">
								{/* ชื่อธนาคาร */}
								<div className="info-item">
									<div className="info-label">ชื่อธนาคาร:</div>
									{isEditing ? (
										<select
											name="bank_name"
											className="form-select"
											value={formData.banks?.[0]?.bank_name || ""}
											onChange={handleChange}
										>
											<option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ (BBL)</option>
											<option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย (KBANK)</option>
											<option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย (KTB)</option>
											<option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์ (SCB)</option>
											<option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา (BAY)</option>
											<option value="ธนาคารทหารไทย">ธนาคารทหารไทย (TMB)</option>
											<option value="ธนาคารธนชาต">ธนาคารธนชาต (TBANK)</option>
											<option value="ธนาคารเกียรตินาคิน">ธนาคารเกียรตินาคิน (KK)</option>
											<option value="ธนาคารทิสโก้">ธนาคารทิสโก้ (TISCO)</option>
											<option value="ธนาคารซีไอเอ็มบีไทย">ธนาคารซีไอเอ็มบีไทย (CIMBT)</option>
											<option value="ธนาคารแลนด์แอนด์เฮ้าส">ธนาคารแลนด์แอนด์เฮ้าส (LH)</option>
											<option value="ธนาคารยูโอบี">ธนาคารยูโอบี (UOB)</option>
											<option value="ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร">
												ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (BACC)
											</option>
											<option value="ธนาคารไอซีบซี">ธนาคารไอซีบซี (ICBC)</option>
											<option value="ธนาคารไอซีบีซี (ไทย)">ธนาคารไอซีบีซี (ไทย)</option>
											<option value="ธนาคารออมสิน">ธนาคารออมสิน (GSB)</option>
										</select>
									) : (
										<div className="info-value">{businessData.banks?.[0]?.bank_name || "-"}</div>
									)}
								</div>

								{/* ชื่อบัญชี */}
								<div className="info-item">
									<div className="info-label">ชื่อบัญชี:</div>
									{isEditing ? (
										<input
											type="text"
											name="bank_account"
											className="form-control"
											value={formData.banks?.[0]?.bank_account || ""}
											onChange={handleChange}
										/>
									) : (
										<div className="info-value">{businessData.banks?.[0]?.bank_account || "-"}</div>
									)}
								</div>

								{/* เลขที่บัญชี */}
								<div className="info-item">
									<div className="info-label">เลขที่บัญชี:</div>
									{isEditing ? (
										<input
											type="text"
											name="bank_number"
											className="form-control"
											value={formData.banks?.[0]?.bank_number || ""}
											onChange={handleChange}
										/>
									) : (
										<div className="info-value">{businessData.banks?.[0]?.bank_number || "-"}</div>
									)}
								</div>
							</div>

							{/* Action Buttons */}
							{isEditing && (
								<div className="action-buttons">
									<button className="btn btn-secondary" onClick={handleCancel}>
										ยกเลิก
									</button>
									<button className="btn btn-primary" onClick={handleSave}>
										บันทึก
									</button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default About;
