import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import SearchableSelect from "@component/searchable-select";
import DatePickerThai from "@component/date-picker-thai";
import { config } from "@constant";
import { useAlert } from "@component/alert/alert-context";
import { fetchApi } from "@utils/api";

const getInitialFormState = () => ({
	sale_number: "HD",
	sale_date: new Date().toISOString().slice(0, 10),
	cus_id: "",
	cus_name: "",
	cus_address: "",
	cus_tel: "",
	cus_tax: "",
	productForms: [],
	remark: "",
	remarkInfernal: "",
	vatType: "non-vat", // non-vat, included-vat, excluded-vat
	sale_totalprice: 0,
	vat: 0,
	grand_total: 0,
	credit_date_number: 30, // Default 30 days
	credit_expired_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
	status: "Pending", // Default
	bus_id: localStorage.getItem("@bus_id"),
	employeeID: localStorage.getItem("user_id"),
	employeeName: localStorage.getItem("user_name"),
});

const QuotationFormModal = ({
	isOpen,
	onClose,
	initialData,
	isEditMode,
	idEditing,
	customerOptions,
	productOptions,
	businessData,
}) => {
	const queryClient = useQueryClient();
	const { success, error } = useAlert();
	const [formData, setFormData] = useState(() => {
		if (initialData && isEditMode) {
			const total = initialData.details.reduce((sum, p) => sum + (parseFloat(p.sale_price) || 0), 0);
			let vat = 0;
			let grandTotal = total;

			if (initialData.vatType === "included-vat") {
				vat = (total * 7) / 107;
			} else if (initialData.vatType === "excluded-vat") {
				vat = total * 0.07;
				grandTotal = total + vat;
			}

			return {
				...getInitialFormState(),
				...initialData,
				sale_number: initialData.quotation_num,
				sale_date: initialData.quotation_start_date
					? initialData.quotation_start_date.slice(0, 10)
					: "",
				productForms: (
					initialData.productForms ||
					initialData.details ||
					initialData.products ||
					[]
				).map((p) => {
					return {
						...p,
						productname: p.productname || p.productName || "",
						productID: p.productID,
						unit: p.unit || p.pro_unti || "",
						sale_qty: p.sale_qty || 1,
						price: p.price || 0,
						description: p.description || p.product_detail || "",
						sale_price: p.sale_price || 0,
					};
				}),
				credit_expired_date: initialData.credit_expired_date
					? initialData.credit_expired_date.slice(0, 10)
					: "",
				cus_id: initialData.cus_id || "",
				bus_id: initialData.bus_id || localStorage.getItem("@bus_id"),
				employeeID: initialData.employeeID || localStorage.getItem("user_id"),
				grand_total: grandTotal || 0,
				vat: vat,
				sale_totalprice: initialData.sale_totalprice || 0,
			};
		}
		return getInitialFormState();
	});

	// Mutations
	const addMutation = useMutation({
		mutationFn: async (newData) => {
			const products = newData.productForms.map((form) => ({
				productID: form.productID,
				productname: form.productname || "",
				sale_price: form.sale_price,
				sale_qty: form.sale_qty,
				product_detail: form.description || "",
				pro_unti: form.unit || "",
				sale_discount: 0,
				discounttype: "percent",
			}));

			const employeeID = localStorage.getItem("user_id");

			const requestBody = {
				sale_number: newData.sale_number,
				sale_date: newData.sale_date,
				cus_id: newData.cus_id,
				bus_id:
					newData.bus_id ||
					businessData?.business?.bus_id ||
					businessData?.bus_id ||
					localStorage.getItem("@bus_id"),
				employeeID: employeeID,
				remark: newData.remark,
				remarkInfernal: newData.remarkInfernal,
				sale_totalprice: newData.sale_totalprice,
				vatType: newData.vatType,
				credit_date_number: newData.credit_date_number,
				credit_expired_date: newData.credit_expired_date,
				status: newData.status,
				products: products,
			};

			const res = await fetchApi(`${config.url}/Quotation/addQuotationSale`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("@accessToken")}`,
				},
				body: JSON.stringify(requestBody),
			});
			const json = await res.json();
			if (!res.ok || json.statusCode !== 200) {
				throw new Error(json.message || json.data || "Failed to add quotation");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(["quotations"]);
			onClose();
			success("เพิ่มข้อมูลสำเร็จ");
		},
		onError: (err) => {
			error(err.message, "เพิ่มข้อมูลล้มเหลว");
		},
	});

	// Remark State
	const [remarkParams, setRemarkParams] = useState({
		deposit: "60",
		duration: "2-3",
		bank: "",
	});

	// Initialize remark params from existing data or business defaults
	React.useEffect(() => {
		if (isEditMode && initialData?.remark) {
			// Try to parse existing remark
			const remark = initialData.remark;
			const depositMatch = remark.match(/2\. มัดจําค่าสินค้า (.*?)%/);
			const durationMatch = remark.match(/3\. ระยะเวลาดําเนินการ (.*?) วัน/);
			const bankMatch = remark.match(/4\. โอนเงินชําระค่าสินค้า ที่ (.*)/);

			setRemarkParams((prev) => ({
				...prev,
				deposit: depositMatch ? depositMatch[1] : prev.deposit,
				duration: durationMatch ? durationMatch[1] : prev.duration,
				bank: bankMatch ? bankMatch[1] : prev.bank,
			}));
		} else {
			// Check for banks in potentially different structures (nested vs flat)
			const banks = businessData?.business?.banks || businessData?.banks || [];

			if (banks.length > 0) {
				// Default from business data
				const bank = banks[0];
				// Format: "ธนาคารไทยพาณิชย์ ( ร้าน เอช แอนด์ ดี อิงเจ็ท ) 146-279212-6"
				const bankStr = `${bank.bank_name ? "ธนาคาร" + bank.bank_name : ""} ( ${
					bank.bank_account || ""
				} ) ${bank.bank_number || ""}`;
				setRemarkParams((prev) => ({ ...prev, bank: bankStr }));
			}
		}

		// Ensure bus_id is set if available in businessData
		if (!formData.bus_id && businessData) {
			const busId =
				businessData.business?.bus_id || businessData.bus_id || localStorage.getItem("@bus_id");
			if (busId) {
				setFormData((prev) => ({ ...prev, bus_id: busId }));
			}
		}
	}, [isEditMode, initialData, businessData, formData.bus_id]);

	// Update formData.remark when params change
	React.useEffect(() => {
		const { deposit, duration, bank } = remarkParams;
		const newRemark = `1. ราคาทีเสนอเป็นเงินบาทไทย\n2. มัดจําค่าสินค้า ${deposit}% ส่วนที่เหลือชําระทั้งหมดในวันส่งของ หรือ ติดตั้งแล้วเสร็จ\n3. ระยะเวลาดําเนินการ ${duration} วัน หลังจากได้รับ มัดจํา หรือระยะเวลาขึ้น อยู่กับปริมาณสินค้าทีลูกค้าสั่งซื้อ หรือตามเงือนไขอื่นๆ ตามที่ตกลงกัน\n4. โอนเงินชําระค่าสินค้า ที่ ${bank}`;

		setFormData((prev) => {
			if (prev.remark === newRemark) return prev;
			return { ...prev, remark: newRemark };
		});
	}, [remarkParams]);

	const handleRemarkChange = (field, value) => {
		setRemarkParams((prev) => ({ ...prev, [field]: value }));
	};

	const updateMutation = useMutation({
		mutationFn: async (updatedData) => {
			const products = updatedData.productForms.map((form) => ({
				productID: form.productID,
				productname: form.productname || "",
				sale_price: form.sale_price,
				sale_qty: form.sale_qty,
				product_detail: form.description || form.product_detail || "",
				pro_unti: form.unit || "",
				sale_discount: 0,
				discounttype: "percent",
			}));

			const requestBody = {
				...updatedData,
				sale_totalprice: updatedData.sale_totalprice,
				products: products,
			};

			const res = await fetchApi(`${config.url}/Quotation/editQuotationSale/${idEditing}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("@accessToken")}`,
				},
				body: JSON.stringify(requestBody),
			});
			if (!res.ok) throw new Error("Failed to update quotation");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries(["quotations"]);
			onClose();
			success("แก้ไขข้อมูลสำเร็จ");
		},
		onError: (err) => {
			error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + err.message, "แก้ไขข้อมูลล้มเหลว");
		},
	});

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleCustomerChange = (e) => {
		const cusName = e.target.value;
		const customer = customerOptions?.find((c) => c.cus_name === cusName);

		if (customer) {
			setFormData((prev) => ({
				...prev,
				cus_name: customer.cus_name,
				cus_id: customer.cus_id,
				cus_address: customer.cus_address,
				cus_tel: customer.cus_tel,
				cus_tax: customer.cus_tax,
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				cus_name: cusName,
				cus_id: "",
				cus_address: "",
				cus_tel: "",
				cus_tax: "",
			}));
		}
	};

	const addProductRow = () => {
		setFormData((prev) => ({
			...prev,
			productForms: [
				...prev.productForms,
				{
					productname: "",
					sale_qty: 1,
					unit: "",
					price: 0,
					description: "",
					sale_price: 0,
				},
			],
		}));
	};

	const removeProductRow = (index) => {
		const newProducts = [...formData.productForms];
		newProducts.splice(index, 1);
		calculateTotals(newProducts, formData.vatType);
	};

	const handleProductChange = (index, field, value) => {
		const newProducts = [...formData.productForms];
		const product = newProducts[index];

		product[field] = value;

		if (field === "productname") {
			const prodData = productOptions?.find((p) => {
				return (p.productName || p.productname) === value;
			});
			if (prodData) {
				product.productID = prodData.productID;
				product.price = prodData.productPrice || prodData.price || 0;
				product.description = prodData.productDetail || prodData.productdetail || "";
				product.unit = prodData.unit;
			}
		}

		const qty = parseFloat(product.sale_qty) || 0;
		const price = parseFloat(product.price) || 0;

		let total = qty * price;

		product.sale_price = total;
		newProducts[index] = product;

		calculateTotals(newProducts, formData.vatType);
	};

	const calculateTotals = (products, vatType) => {
		const total = products.reduce((sum, p) => sum + (parseFloat(p.sale_price) || 0), 0);

		let vat = 0;
		let grandTotal = total;

		if (vatType === "included-vat") {
			vat = (total * 7) / 107;
		} else if (vatType === "excluded-vat") {
			vat = total * 0.07;
			grandTotal = total + vat;
		}

		setFormData((prev) => ({
			...prev,
			productForms: products,
			sale_totalprice: total, // Matches sale_totalprice
			vat: vat,
			grand_total: grandTotal,
			vatType: vatType,
		}));
	};

	const handleVatChange = (e) => {
		const newVatType = e.target.value;
		calculateTotals(formData.productForms, newVatType);
	};

	const handleFormSubmit = (e) => {
		e.preventDefault();
		if (isEditMode) updateMutation.mutate(formData);
		else addMutation.mutate(formData);
	};

	if (!isOpen) return null;

	return (
		<div
			className="modal show d-block"
			tabIndex="-1"
			style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
		>
			<div className="modal-dialog modal-lg" style={{ maxWidth: "80vw" }}>
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title">{isEditMode ? "แก้ไขใบเสนอราคา" : "สร้างใบเสนอราคา"}</h5>
						<button type="button" className="btn-close" onClick={onClose}></button>
					</div>
					<form onSubmit={handleFormSubmit}>
						<div className="modal-body">
							{/* Header Info */}
							<div className="row mb-3">
								<div className="col-md-6">
									<label className="form-label">เลขที่ใบเสนอราคา:</label>
									<input
										type="text"
										className="form-control"
										name="sale_number"
										value={formData.sale_number}
										onChange={handleInputChange}
										required
									/>
								</div>
								<div className="col-md-6">
									<label className="form-label">วันที่:</label>
									<DatePickerThai
										className="form-control"
										name="sale_date"
										value={formData.sale_date}
										onChange={handleInputChange}
										placeholder="วัน/เดือน/ปี"
										required
									/>
								</div>
							</div>

							{/* Customer Info */}
							<div className="row mb-3">
								<div className="col-md-12">
									<h5>ข้อมูลลูกค้า</h5>
								</div>
								<div className="col-md-12">
									<label className="form-label">ชื่อบริษัท/ชื่อลูกค้า:</label>
									<SearchableSelect
										options={customerOptions || []}
										value={formData.cus_name}
										labelKey="cus_name"
										valueKey="cus_name"
										onChange={(val) => {
											handleCustomerChange({ target: { value: val } });
										}}
										placeholder="กรุณากรอกชื่อบริษัท/ชื่อลูกค้า"
									/>
								</div>
								<div className="col-md-12 mt-2">
									<label className="form-label">ที่อยู่บริษัท/ลูกค้า:</label>
									<input
										type="text"
										className="form-control"
										name="cus_address"
										value={formData.cus_address}
										onChange={handleInputChange}
										placeholder="กรุณากรองที่อยู่"
									/>
								</div>
								<div className="col-md-12 mt-2">
									<label className="form-label">เบอร์โทรศัพท์:</label>
									<input
										type="text"
										className="form-control"
										name="cus_tel"
										value={formData.cus_tel}
										onChange={handleInputChange}
										placeholder="กรุณากรอกเบอร์โทรศัพท์"
									/>
								</div>
								<div className="col-md-12 mt-2">
									<label className="form-label">เลขประจำตัวผู้เสียภาษี:</label>
									<input
										type="text"
										className="form-control"
										name="cus_tax"
										value={formData.cus_tax}
										onChange={handleInputChange}
										placeholder="กรุณากรอกเลขประจำตัวผู้เสียภาษี"
									/>
								</div>
							</div>

							<hr />

							{/* Products */}
							<div className="mb-3">
								<label className="form-label d-flex justify-content-between">
									<span>รายการสินค้า</span>
									<button type="button" className="btn btn-sm btn-primary" onClick={addProductRow}>
										+ เพิ่มสินค้า
									</button>
								</label>
								<div className="table-responsive">
									<table className="table table-bordered">
										<thead>
											<tr>
												<th width="40%">ชื่อสินค้า</th>
												<th width="15%">ราคา</th>
												<th width="15%">จำนวน</th>
												<th width="15%">หน่วย</th>
												<th width="15%">ราคารวม</th>
												<th width="5%">ลบ</th>
											</tr>
										</thead>
										<tbody>
											{formData.productForms.map((product, index) => (
												<React.Fragment key={index}>
													<tr>
														<td>
															<SearchableSelect
																options={productOptions || []}
																value={product.productname}
																labelKey="productname"
																valueKey="productname"
																onChange={(val) => handleProductChange(index, "productname", val)}
																placeholder="เลือกสินค้า"
															/>
														</td>
														<td>
															<input
																type="number"
																className="form-control"
																min="0"
																step="0.01"
																value={product.price}
																onChange={(e) =>
																	handleProductChange(index, "price", e.target.value)
																}
															/>
														</td>
														<td>
															<input
																type="number"
																className="form-control"
																min="1"
																value={product.sale_qty}
																onChange={(e) =>
																	handleProductChange(index, "sale_qty", e.target.value)
																}
															/>
														</td>
														<td>
															<input
																type="text"
																className="form-control"
																value={product.unit}
																onChange={(e) => handleProductChange(index, "unit", e.target.value)}
															/>
														</td>
														<td className="text-end align-middle">
															{parseFloat(product.sale_price).toFixed(2)}
														</td>
														<td>
															<button
																type="button"
																className="btn btn-sm btn-danger"
																onClick={() => removeProductRow(index)}
															>
																X
															</button>
														</td>
													</tr>
													<tr>
														<td colSpan="6" className="p-0 border-0">
															<div className="p-2 bg-light">
																<textarea
																	className="form-control"
																	placeholder="เพิ่มรายละเอียดสินค้า"
																	rows="2"
																	value={product.description || ""}
																	onChange={(e) =>
																		handleProductChange(index, "description", e.target.value)
																	}
																></textarea>
															</div>
														</td>
													</tr>
												</React.Fragment>
											))}
										</tbody>
									</table>
								</div>
							</div>

							{/* Totals & Credit */}
							<div className="row mt-4">
								<div className="col-md-12">
									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">ราคารวม:</label>
										<div className="col-sm-9">
											<input
												type="text"
												className="form-control bg-light"
												disabled
												value={parseFloat(formData.sale_totalprice).toFixed(2)}
											/>
										</div>
									</div>
									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">ประเภท VAT:</label>
										<div className="col-sm-9">
											<div className="form-check form-check-inline">
												<input
													className="form-check-input"
													type="radio"
													name="vatType"
													id="non-vat"
													value="non-vat"
													checked={formData.vatType === "non-vat"}
													onChange={handleVatChange}
												/>
												<label className="form-check-label" htmlFor="non-vat">
													ไม่มีภาษี
												</label>
											</div>
											<div className="form-check form-check-inline">
												<input
													className="form-check-input"
													type="radio"
													name="vatType"
													id="excluded-vat"
													value="excluded-vat"
													checked={formData.vatType === "excluded-vat"}
													onChange={handleVatChange}
												/>
												<label className="form-check-label" htmlFor="excluded-vat">
													แยกภาษีมูลค่าเพิ่ม
												</label>
											</div>
											<div className="form-check form-check-inline">
												<input
													className="form-check-input"
													type="radio"
													name="vatType"
													id="included-vat"
													value="included-vat"
													checked={formData.vatType === "included-vat"}
													onChange={handleVatChange}
												/>
												<label className="form-check-label" htmlFor="included-vat">
													รวมภาษีมูลค่าเพิ่ม
												</label>
											</div>
										</div>
									</div>
									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">ภาษี:</label>
										<div className="col-sm-9">
											<input
												type="text"
												className="form-control bg-light"
												disabled
												value={parseFloat(formData.vat).toFixed(2)}
											/>
										</div>
									</div>
									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">ราคาสุทธิ:</label>
										<div className="col-sm-9">
											<input
												type="text"
												className="form-control bg-light"
												disabled
												value={parseFloat(formData.grand_total).toFixed(2)}
											/>
										</div>
									</div>

									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">หมายเหตุ:</label>
										<div className="col-sm-9">
											<div className="card p-2 bg-light">
												<div className="mb-1">1. ราคาที่เสนอเป็นเงินบาทไทย</div>
												<div className="mb-1 d-flex align-items-center flex-wrap">
													<div className="me-1">2. มัดจําค่าสินค้า</div>
													<input
														type="text"
														className="form-control form-control-sm d-inline-block text-center"
														style={{ width: "60px" }}
														value={remarkParams.deposit}
														onChange={(e) => handleRemarkChange("deposit", e.target.value)}
													/>
													<div className="ms-1">
														% ส่วนที่เหลือชําระทั้งหมดในวันส่งของ หรือ ติดตั้งแล้วเสร็จ
													</div>
												</div>
												<div className="mb-1 d-flex align-items-center flex-wrap">
													<div className="me-1">3. ระยะเวลาดําเนินการ</div>
													<input
														type="text"
														className="form-control form-control-sm d-inline-block text-center"
														style={{ width: "80px" }}
														value={remarkParams.duration}
														onChange={(e) => handleRemarkChange("duration", e.target.value)}
													/>
													<div className="ms-1">วัน หลังจากได้รับ มัดจํา</div>
													<div className="ms-1">
														หรือระยะเวลาขึ้น อยู่กับปริมาณสินค้าทีลูกค้าสั่งซื้อ หรือตามเงือนไขอื่นๆ
														ตามที่ตกลงกัน
													</div>
												</div>
												<div className="mb-1 d-flex align-items-center flex-wrap">
													<div className="me-1">4. โอนเงินชําระค่าสินค้า ที่</div>
													<input
														type="text"
														className="form-control form-control-sm d-inline-block"
														style={{ minWidth: "500px", width: "auto" }}
														value={remarkParams.bank}
														onChange={(e) => handleRemarkChange("bank", e.target.value)}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" onClick={onClose}>
								ยกเลิก
							</button>
							<button type="submit" className="btn btn-primary">
								บันทึก
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default QuotationFormModal;
