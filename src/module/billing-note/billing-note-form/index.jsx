import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import SearchableSelect from "@component/searchable-select";
import DatePickerThai from "@component/date-picker-thai";
import { config } from "@constant";
import { useAlert } from "@component/alert/alert-context";
import { fetchApi } from "@utils/api";

const getInitialFormState = () => ({
	billing_number: "HD",
	billing_date: new Date().toISOString().slice(0, 10),
	cus_id: "",
	cus_name: "",
	cus_address: "",
	cus_tel: "",
	cus_tax: "",
	productForms: [],
	remark: "",
	vatType: "non-vat", // non-vat, included-vat, excluded-vat
	payment_method: "เงินสด", // เงินสด, เงินโอน, เช็ค
	total_price: 0,
	vat: 0,
	grand_total: 0,
	pay_bank: "",
	pay_number: "", // Check No. or Account No.
	pay_branch: "",
	pay_date: new Date().toISOString().slice(0, 10),
	pay_time: "",
	pay_image_url: "",
	amount_text: "",
	bus_id: localStorage.getItem("@bus_id"),
	employeeID: localStorage.getItem("user_id"),
	employeeName: localStorage.getItem("user_name"),
});

const BillingNoteFormModal = ({
	isOpen,
	onClose,
	initialData,
	isEditMode,
	idEditing,
	customerOptions,
	productOptions,
}) => {
	const queryClient = useQueryClient();
	const { success, error } = useAlert();
	const [sourceType, setSourceType] = useState("none"); // none, quotation, invoice

	// Fetch Pending Quotations
	const { data: quotations = [] } = useQuery({
		queryKey: ["quotations", "pending-for-billing"],
		queryFn: async () => {
			const res = await fetchApi(`${config.url}/Quotation/getQuotation`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
			});
			const json = await res.json();
			return json.data || [];
		},
		enabled: !isEditMode,
	});

	const pendingQuotations = React.useMemo(() => {
		if (!quotations) return [];
		return quotations.filter((q) => q.status !== "Billed" && q.status !== "Cancel");
	}, [quotations]);

	// Fetch Pending Invoices
	const { data: invoices = [] } = useQuery({
		queryKey: ["invoices", "pending-for-billing"],
		queryFn: async () => {
			const res = await fetchApi(`${config.url}/Invoice/getInvoice`, {
				headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
			});
			const json = await res.json();
			return json.data || [];
		},
		enabled: !isEditMode,
	});

	const pendingInvoices = React.useMemo(() => {
		if (!invoices) return [];
		return invoices.filter(
			(i) =>
				i.invoice_status !== "Complete" &&
				i.invoice_status !== "Billed" &&
				i.invoice_status !== "Cancel"
		);
		// Assuming 'Complete' or 'Billed' is the final status
	}, [invoices]);

	const [formData, setFormData] = useState(() => {
		if (initialData && isEditMode) {
			const total = (initialData.productForms || initialData.products || []).reduce(
				(sum, p) => sum + (parseFloat(p.sale_price) || 0),
				0
			);
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
				productForms: (
					initialData.productForms ||
					initialData.details ||
					initialData.products ||
					[]
				).map((p) => ({
					...p,
					productname: p.productname || p.productName || "",
					productID: p.productID,
					unit: p.unit || p.pro_unti || "",
					sale_qty: p.sale_qty || 1,
					price: p.price || 0,
					description: p.description || p.product_detail || "",
					sale_price: p.sale_price || 0,
				})),
				billing_date: initialData.billing_date ? initialData.billing_date.slice(0, 10) : "",
				pay_date: initialData.pay_date ? initialData.pay_date.slice(0, 10) : "",
				pay_image_url: initialData.pay_image_url || "",
				payment_method: initialData.payment_method || initialData.payments || "เงินสด",
				cus_id: initialData.cus_id || "",
				bus_id: initialData.bus_id || localStorage.getItem("@bus_id"),
				employeeID: initialData.employeeID || localStorage.getItem("user_id"),
				employeeName: initialData.employeeName || localStorage.getItem("user_name"),
				grand_total: grandTotal || 0,
				vat: vat,
				total_price: initialData.sale_totalprice || initialData.total_price || 0,
			};
		}
		return getInitialFormState();
	});

	const handleSourceSelect = (type, item) => {
		if (!item) return;

		const newData = { ...getInitialFormState() }; // Reset or keep some? Better reset to avoid conflicts
		// But keep date/number generated?
		newData.billing_number = formData.billing_number;
		newData.billing_date = formData.billing_date; // Keep current form date

		newData.cus_id = item.cus_id;
		newData.cus_name = item.cus_name;
		newData.cus_address = item.cus_address;
		newData.cus_tel = item.cus_tel;
		newData.cus_tax = item.cus_tax;
		newData.vatType = item.vatType || "non-vat";

		if (type === "quotation") {
			newData.sale_id = item.sale_id;
			newData.invoice_id = null;
		} else if (type === "invoice") {
			newData.invoice_id = item.invoice_id;
			newData.sale_id = item.sale_id; // Invoice usually has sale_id
		}

		// Map Products
		// Need to check if item has products/details
		// If getting list from getInvoice/getQuotation, details might be missing or under different keys
		// Assuming details/products/quotation_sale_details exists
		const productsRaw = item.products || item.details || item.quotation_sale_details || [];

		newData.productForms = productsRaw.map((p) => ({
			...p,
			productname: p.productname || p.productName || "",
			productID: p.productID,
			unit: p.unit || p.pro_unti || "",
			sale_qty: p.sale_qty || 1,
			price: p.price || 0,
			description: p.description || p.product_detail || "",
			sale_price: p.sale_price || 0,
		}));

		newData.total_price = item.sale_totalprice || item.total_grand || 0;
		// Recalculate grand totals will sort itself out via calculateTotals if we trigger it,
		// but let's pre-fill if available
		// ...

		setFormData((prev) => ({ ...prev, ...newData }));
		// Trigger calculation logic if needed (via effect or direct helper call if extracted)
	};

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
			}));

			const employeeID = localStorage.getItem("user_id");

			const requestBody = {
				billing_number: newData.billing_number,
				billing_date: newData.billing_date,
				cus_id: newData.cus_id,
				bus_id: newData.bus_id || localStorage.getItem("@bus_id"),
				employeeID: employeeID,
				payments: newData.payment_method,
				pay_bank: newData.pay_bank,
				pay_number: newData.pay_number,
				pay_branch: newData.pay_branch,
				pay_date: newData.pay_date ? new Date(newData.pay_date).toISOString().split("T")[0] : "",
				pay_image_url: newData.pay_image_url,
				remark: newData.remark,
				sale_totalprice: newData.total_price,
				vatType: newData.vatType,
				products: products,
				invoice_id: newData.invoice_id,
				sale_id: newData.sale_id,
			};

			const res = await fetchApi(`${config.url}/Billing/createBilling`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("@accessToken")}`,
				},
				body: JSON.stringify(requestBody),
			});
			const json = await res.json();
			if (!res.ok || (json.statusCode !== 200 && json.statusCode !== 201)) {
				// Handle specific error codes if needed, e.g. 400
				const errData = json.data;
				if (json.statusCode === 400 && errData === "Billing number already exists") {
					throw new Error("เลขที่ใบเสร็จซ้ำกับข้อมูลในระบบ");
				}
				const errorMessage =
					json.message ||
					(typeof errData === "string" ? errData : JSON.stringify(errData)) ||
					"Failed to add billing";
				throw new Error(errorMessage);
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(["billings"]);
			onClose();
			success("เพิ่มข้อมูลสำเร็จ");
		},
		onError: (err) => {
			error(err.message, "เพิ่มข้อมูลล้มเหลว");
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (updatedData) => {
			const products = updatedData.productForms.map((form) => ({
				productID: form.productID,
				productname: form.productname || "",
				sale_price: form.sale_price,
				sale_qty: form.sale_qty,
				product_detail: form.description || form.product_detail || "",
				pro_unti: form.unit || "",
			}));

			const requestBody = {
				...updatedData,
				payments: updatedData.payment_method,
				sale_totalprice: updatedData.total_price,
				products: products,
				pay_image_url: updatedData.pay_image_url,
			};

			const res = await fetchApi(`${config.url}/Billing/editBilling/${idEditing}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("@accessToken")}`,
				},
				body: JSON.stringify(requestBody),
			});
			if (!res.ok) throw new Error("Failed to update billing");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries(["billings"]);
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

	const [isUploadingImage, setIsUploadingImage] = useState(false);
	const handleImageUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const formDataUpload = new FormData();
		formDataUpload.append("file", file);

		setIsUploadingImage(true);
		try {
			const res = await fetchApi(`${config.url}/Billing/uploadSlipImage`, {
				method: "POST",
				body: formDataUpload,
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.message || "Failed to upload image");
			
			setFormData((prev) => ({ ...prev, pay_image_url: json.data.pay_image_url }));
			success("อัพโหลดรูปภาพสำเร็จ");
		} catch (err) {
			error(err.message, "อัพโหลดรูปล้มเหลว");
		} finally {
			setIsUploadingImage(false);
		}
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
				if (prodData.unit || prodData.productUnit) {
					product.unit = prodData.unit || prodData.productUnit;
				}
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
			total_price: total,
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
			<div className="modal-dialog modal-xl">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title">{isEditMode ? "แก้ไขใบเสร็จ" : "สร้างใบเสร็จ"}</h5>
						<button type="button" className="btn-close" onClick={onClose}></button>
					</div>
					<form onSubmit={handleFormSubmit}>
						<div className="modal-body">
							{!isEditMode && (
								<div className="mb-3 border p-3 rounded bg-light">
									<label className="form-label fw-bold">เลือกแหล่งที่มาของข้อมูล:</label>
									<div className="d-flex gap-3 mb-2">
										<div className="form-check">
											<input
												className="form-check-input"
												type="radio"
												name="sourceType"
												id="srcNone"
												checked={sourceType === "none"}
												onChange={() => setSourceType("none")}
											/>
											<label className="form-check-label" htmlFor="srcNone">
												สร้างใหม่ (ไม่เลือกเอกสาร)
											</label>
										</div>
										<div className="form-check">
											<input
												className="form-check-input"
												type="radio"
												name="sourceType"
												id="srcQt"
												checked={sourceType === "quotation"}
												onChange={() => setSourceType("quotation")}
											/>
											<label className="form-check-label" htmlFor="srcQt">
												จากใบเสนอราคา
											</label>
										</div>
										<div className="form-check">
											<input
												className="form-check-input"
												type="radio"
												name="sourceType"
												id="srcInv"
												checked={sourceType === "invoice"}
												onChange={() => setSourceType("invoice")}
											/>
											<label className="form-check-label" htmlFor="srcInv">
												จากใบแจ้งหนี้
											</label>
										</div>
									</div>

									{sourceType === "quotation" && (
										<SearchableSelect
											options={pendingQuotations}
											value=""
											labelKey="sale_number"
											valueKey="sale_id"
											onChange={(val) => {
												const item = pendingQuotations.find((q) => q.sale_id === val);
												handleSourceSelect("quotation", item);
											}}
											placeholder="เลือกใบเสนอราคา..."
										/>
									)}

									{sourceType === "invoice" && (
										<SearchableSelect
											options={pendingInvoices}
											value=""
											labelKey="invoice_number"
											valueKey="invoice_id"
											onChange={(val) => {
												const item = pendingInvoices.find((i) => i.invoice_id === val);
												handleSourceSelect("invoice", item);
											}}
											placeholder="เลือกใบแจ้งหนี้..."
										/>
									)}
								</div>
							)}

							{/* Header Info */}
							<div className="row mb-3">
								<div className="col-md-12">
									<label className="form-label">เลขที่ใบเสร็จ:</label>
									<input
										type="text"
										className="form-control"
										name="billing_number"
										value={formData.billing_number}
										onChange={handleInputChange}
										required
									/>
								</div>
								<div className="col-md-12 mt-2">
									<label className="form-label">วันที่:</label>
									<DatePickerThai
										className="form-control"
										name="billing_date"
										value={formData.billing_date}
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
											// Mimic event object for handleCustomerChange
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

							{/* Totals & Payment */}
							<div className="row mt-4">
								<div className="col-md-12">
									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">ราคารวม:</label>
										<div className="col-sm-9">
											<input
												type="text"
												className="form-control bg-light"
												disabled
												value={parseFloat(formData.total_price).toFixed(2)}
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
										<label className="col-sm-3 col-form-label">รูปแบบการชำระเงิน:</label>
										<div className="col-sm-9">
											<select
												className="form-select"
												name="payment_method"
												value={formData.payment_method}
												onChange={handleInputChange}
											>
												<option value="เงินสด">เงินสด</option>
												<option value="เงินโอน">เงินโอน</option>
												<option value="เช็ค">เช็ค</option>
											</select>
										</div>
									</div>

									{/* Conditional Payment Fields */}
									{formData.payment_method === "เงินโอน" && (
										<div className="card p-3 mb-3 border bg-light">
											<div className="mb-3 row">
												<label className="col-sm-3 col-form-label">ธนาคาร:</label>
												<div className="col-sm-9">
													<select
														className="form-select"
														name="pay_bank"
														value={formData.pay_bank}
														onChange={handleInputChange}
													>
														<option value="">เลือกธนาคาร</option>
														<option value="กสิกรไทย">กสิกรไทย (KBANK)</option>
														<option value="ไทยพาณิชย์">ไทยพาณิชย์ (SCB)</option>
														<option value="กรุงเทพ">กรุงเทพ (BBL)</option>
														<option value="กรุงไทย">กรุงไทย (KTB)</option>
														<option value="กรุงศรีอยุธยา">กรุงศรีอยุธยา (BAY)</option>
														<option value="ทีทีบี">ทีทีบี (TTB)</option>
														<option value="ออมสิน">ออมสิน (GSB)</option>
														<option value="ธ.ก.ส.">ธ.ก.ส. (BAAC)</option>
													</select>
												</div>
											</div>
											<div className="mb-3 row">
												<label className="col-sm-3 col-form-label">เลขที่:</label>
												<div className="col-sm-9">
													<input
														type="text"
														className="form-control"
														name="pay_number"
														value={formData.pay_number}
														onChange={handleInputChange}
														placeholder="เลขที่ทำรายการ"
													/>
												</div>
											</div>
											<div className="mb-3 row">
												<label className="col-sm-3 col-form-label">สาขา:</label>
												<div className="col-sm-9">
													<input
														type="text"
														className="form-control"
														name="pay_branch"
														value={formData.pay_branch}
														onChange={handleInputChange}
														placeholder="สาขาธนาคาร"
													/>
												</div>
											</div>
											<div className="mb-3 row">
												<label className="col-sm-3 col-form-label">วันที่ทำรายการ:</label>
												<div className="col-sm-9">
													<DatePickerThai
														className="form-control"
														name="pay_date"
														value={formData.pay_date}
														onChange={handleInputChange}
														placeholder="วัน/เดือน/ปี"
													/>
												</div>
											</div>
											<div className="mb-3 row">
												<label className="col-sm-3 col-form-label">เวลา:</label>
												<div className="col-sm-9">
													<input
														type="time"
														className="form-control"
														name="pay_time"
														value={formData.pay_time}
														onChange={handleInputChange}
													/>
												</div>
											</div>
											<div className="mb-3 row">
												<label className="col-sm-3 col-form-label">รูปสลิปเงินโอน:</label>
												<div className="col-sm-9">
													<input
														type="file"
														className="form-control"
														accept="image/png, image/jpeg"
														onChange={handleImageUpload}
													/>
													{isUploadingImage && <span className="text-primary mt-2 d-inline-block">กำลังอัปโหลด...</span>}
													{formData.pay_image_url && !isUploadingImage && (
														<div className="mt-3">
															<img
																src={formData.pay_image_url}
																alt="Slip"
																style={{ maxWidth: "200px", borderRadius: "8px", border: "1px solid #ddd" }}
															/>
														</div>
													)}
												</div>
											</div>
										</div>
									)}

									{formData.payment_method === "เช็ค" && (
										<div className="card p-3 mb-3 border bg-light">
											<div className="mb-3 row">
												<label className="col-sm-3 col-form-label">ธนาคาร:</label>
												<div className="col-sm-9">
													<select
														className="form-select"
														name="pay_bank"
														value={formData.pay_bank}
														onChange={handleInputChange}
													>
														<option value="">เลือกธนาคาร</option>
														<option value="กสิกรไทย">กสิกรไทย (KBANK)</option>
														<option value="ไทยพาณิชย์">ไทยพาณิชย์ (SCB)</option>
														<option value="กรุงเทพ">กรุงเทพ (BBL)</option>
														<option value="กรุงไทย">กรุงไทย (KTB)</option>
														<option value="กรุงศรีอยุธยา">กรุงศรีอยุธยา (BAY)</option>
														<option value="ทีทีบี">ทีทีบี (TTB)</option>
														<option value="ออมสิน">ออมสิน (GSB)</option>
														<option value="ธ.ก.ส.">ธ.ก.ส. (BAAC)</option>
													</select>
												</div>
											</div>
											<div className="mb-3 row">
												<label className="col-sm-3 col-form-label">เลขที่:</label>
												<div className="col-sm-9">
													<input
														type="text"
														className="form-control"
														name="pay_number"
														value={formData.pay_number}
														onChange={handleInputChange}
														placeholder="เลขที่เช็ค"
													/>
												</div>
											</div>
											<div className="mb-3 row">
												<label className="col-sm-3 col-form-label">สาขา:</label>
												<div className="col-sm-9">
													<input
														type="text"
														className="form-control"
														name="pay_branch"
														value={formData.pay_branch}
														onChange={handleInputChange}
														placeholder="สาขา"
													/>
												</div>
											</div>
											<div className="mb-3 row">
												<label className="col-sm-3 col-form-label">วันที่ลงเช็ค:</label>
												<div className="col-sm-9">
													<DatePickerThai
														className="form-control"
														name="pay_date"
														value={formData.pay_date}
														onChange={handleInputChange}
														placeholder="วัน/เดือน/ปี"
													/>
												</div>
											</div>
											<div className="mb-3 row">
												<label className="col-sm-3 col-form-label">รูปภาพเช็ค:</label>
												<div className="col-sm-9">
													<input
														type="file"
														className="form-control"
														accept="image/png, image/jpeg"
														onChange={handleImageUpload}
													/>
													{isUploadingImage && <span className="text-primary mt-2 d-inline-block">กำลังอัปโหลด...</span>}
													{formData.pay_image_url && !isUploadingImage && (
														<div className="mt-3">
															<img
																src={formData.pay_image_url}
																alt="Cheque"
																style={{ maxWidth: "200px", borderRadius: "8px", border: "1px solid #ddd" }}
															/>
														</div>
													)}
												</div>
											</div>
										</div>
									)}

									<div className="mb-3 row">
										<label className="col-sm-3 col-form-label">หมายเหตุ:</label>
										<div className="col-sm-9">
											<textarea
												className="form-control"
												name="remark"
												value={formData.remark}
												onChange={handleInputChange}
												rows="3"
												placeholder="กรอกหมายเหตุ"
											></textarea>
											<div className="text-muted small mt-2">105 ตัวอักษร ที่สามารถกรอกได้</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className="modal-footer">
							<button type="button" className="btn btn-secondary" onClick={onClose}>
								ยกเลิก
							</button>
							<button type="submit" className="btn btn-primary" disabled={isUploadingImage}>
								{isEditMode ? "บันทึกการแก้ไข" : "บันทึก"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default BillingNoteFormModal;
