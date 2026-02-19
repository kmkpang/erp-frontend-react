import React, { useState } from "react";
import PropTypes from "prop-types";

const ProductFormModal = ({ isOpen, onClose, onSubmit, initialData, categories = [] }) => {
	const defaultCategory = categories.find((c) => c.categoryName === "ไม่มีหมวดหมู่");
	const defaultCategoryId = defaultCategory
		? defaultCategory.categoryID
		: categories.length > 0
			? categories[0].categoryID
			: "";

	const [formData, setFormData] = useState({
		productname: initialData?.productname || "",
		productdetail: initialData?.productdetail || "",
		price: initialData?.price || "",
		amount: initialData?.amount || 0,
		productcost: initialData?.productcost || 0,
		categoryID: initialData?.categoryID || defaultCategoryId,
		productTypeID: initialData?.productTypeID || 1,
		Status: initialData?.Status || "active",
	});
	const [imageFile, setImageFile] = useState(null);
	const [previewImage, setPreviewImage] = useState(initialData?.productImg || null);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setImageFile(file);
			setPreviewImage(URL.createObjectURL(file));
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const data = new FormData();
		data.append("productname", formData.productname);
		data.append("productdetail", formData.productdetail);
		data.append("price", formData.price);
		data.append("amount", formData.amount);
		data.append("productcost", formData.productcost);
		data.append("categoryID", formData.categoryID);
		data.append("productTypeID", formData.productTypeID);
		data.append("Status", formData.Status);
		if (imageFile) {
			data.append("file", imageFile);
		}
		onSubmit(data);
	};

	if (!isOpen) return null;

	return (
		<div
			className="modal show d-block"
			style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
			tabIndex="-1"
		>
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header border-0 pb-0">
						<h5 className="modal-title fw-bold">
							{initialData ? "แก้ไขข้อมูลสินค้า" : "เพิ่มข้อมูลสินค้า"}
						</h5>
						<button
							type="button"
							className="btn-close"
							onClick={onClose}
							aria-label="Close"
						></button>
					</div>
					<form onSubmit={handleSubmit}>
						<div className="modal-body pt-3">
							{/* Category */}
							<div className="row mb-3 align-items-center">
								<label className="col-sm-3 col-form-label">หมวดหมู่:</label>
								<div className="col-sm-9">
									<select
										className="form-select"
										name="categoryID"
										value={formData.categoryID}
										onChange={handleChange}
									>
										{categories.map((cat) => (
											<option key={cat.categoryID} value={cat.categoryID}>
												{cat.categoryName}
											</option>
										))}
									</select>
								</div>
							</div>

							{/* Product Name */}
							<div className="row mb-3 align-items-center">
								<label className="col-sm-3 col-form-label">
									<span className="text-danger">*</span>ชื่อสินค้า:
								</label>
								<div className="col-sm-9">
									<input
										type="text"
										className="form-control"
										placeholder="กรุณากรอกชื่อสินค้า/บริการ"
										name="productname"
										value={formData.productname}
										onChange={handleChange}
										required
									/>
								</div>
							</div>

							{/* Detail */}
							<div className="row mb-3 align-items-center">
								<label className="col-sm-3 col-form-label">รายละเอียด:</label>
								<div className="col-sm-9">
									<input
										type="text"
										className="form-control"
										placeholder="กรอกรายละเอียด"
										name="productdetail"
										value={formData.productdetail}
										onChange={handleChange}
									/>
								</div>
							</div>

							{/* Price */}
							<div className="row mb-3 align-items-center">
								<label className="col-sm-3 col-form-label">
									<span className="text-danger">*</span>ราคาขาย:
								</label>
								<div className="col-sm-9">
									<input
										type="number"
										className="form-control"
										placeholder="กรอกราคา"
										name="price"
										value={formData.price}
										onChange={handleChange}
										onWheel={(e) => e.target.blur()}
										required
									/>
								</div>
							</div>

							{/* Image */}
							<div className="row mb-3">
								<div className="col-sm-9 offset-sm-3">
									<div className="input-group mb-1">
										<input
											type="file"
											className="form-control"
											accept="image/png, image/jpeg"
											onChange={handleFileChange}
										/>
									</div>
									<small className="text-info text-decoration-underline">
										*ไฟล์รูปภาพขนาดไม่เกิน 5 MB
									</small>
									{previewImage && (
										<div className="mt-2">
											<img
												src={previewImage}
												alt="Preview"
												style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "cover" }}
											/>
										</div>
									)}
								</div>
							</div>
						</div>

						<div className="modal-footer border-0 pt-0">
							<div className="w-100 d-flex justify-content-end gap-2">
								<button type="submit" className="btn btn-primary px-4">
									{initialData ? "บันทึก" : "เพิ่ม"}
								</button>
								<button type="button" className="btn btn-secondary px-4" onClick={onClose}>
									ยกเลิก
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

ProductFormModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	initialData: PropTypes.object,
	categories: PropTypes.array,
};

export default ProductFormModal;
