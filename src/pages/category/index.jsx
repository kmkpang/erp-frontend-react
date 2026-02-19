import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TableList from "@component/table-list";
import { config } from "@constant";

const Category = () => {
	const queryClient = useQueryClient();
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [formData, setFormData] = useState({
		categoryID: "",
		categoryName: "",
	});
	const [errors, setErrors] = useState({});

	const { data: categories = [], isLoading } = useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/product/getCategory`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const json = await response.json();
			if (json.statusCode === 200) {
				return json.data;
			}
			throw new Error("Failed to fetch categories");
		},
	});

	const addMutation = useMutation({
		mutationFn: async (newData) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/product/Addcategory`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ categoryName: newData.categoryName }),
			});
			const json = await response.json();
			if (json.statusCode !== 200) {
				throw new Error(json.data || "Failed to add category");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			handleClosePopup();
			alert("เพิ่มข้อมูลสำเร็จ");
		},
		onError: (error) => {
			alert("เกิดข้อผิดพลาด: " + error.message);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (updatedData) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/product/EditCategory/${updatedData.categoryID}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ categoryName: updatedData.categoryName }),
			});
			const json = await response.json();
			if (json.statusCode !== 200) {
				throw new Error(json.data || "Failed to update category");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			handleClosePopup();
			alert("แก้ไขข้อมูลสำเร็จ");
		},
		onError: (error) => {
			alert("เกิดข้อผิดพลาด: " + error.message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (categoryID) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/product/DeleteCategory/${categoryID}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});
			const json = await response.json();
			if (json.statusCode !== 200) {
				let errorMsg = json.data || "Failed to delete category";
				if (
					typeof json.data === "string" &&
					json.data.includes("violates foreign key constraint")
				) {
					errorMsg = "ไม่สามารถลบหมวดหมู่ได้เนื่องจากมีการใช้งานอยู่";
				}
				throw new Error(errorMsg);
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			alert("ลบข้อมูลสำเร็จ");
		},
		onError: (error) => {
			alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
		},
	});

	const handleOpenAdd = () => {
		setFormData({ categoryID: "", categoryName: "" });
		setErrors({});
		setIsEditMode(false);
		setIsPopupOpen(true);
	};

	const handleEdit = (item) => {
		setFormData({
			categoryID: item.categoryID || item.ID,
			categoryName: item.categoryName || item["Category Name"],
		});
		setErrors({});
		setIsEditMode(true);
		setIsPopupOpen(true);
	};

	const handleDelete = (item) => {
		const categoryID = item.categoryID || item.ID;
		if (
			window.confirm(
				`คุณต้องการลบหมวดหมู่ "${item.categoryName || item["Category Name"]}" ใช่หรือไม่?`
			)
		) {
			deleteMutation.mutate(categoryID);
		}
	};

	const handleClosePopup = () => {
		setIsPopupOpen(false);
		setFormData({ categoryID: "", categoryName: "" });
		setErrors({});
	};

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
		if (errors[e.target.name]) {
			setErrors({ ...errors, [e.target.name]: null });
		}
	};

	const validateForm = () => {
		const newErrors = {};
		if (!formData.categoryName.trim()) {
			newErrors.categoryName = "กรุณาระบุชื่อหมวดหมู่";
		} else {
			// Check for duplicate name
			const isDuplicate = categories.some(
				(item) =>
					(item.categoryName || item["Category Name"]).trim().toLowerCase() ===
						formData.categoryName.trim().toLowerCase() &&
					(item.categoryID || item.ID) !== formData.categoryID
			);
			if (isDuplicate) {
				newErrors.categoryName = "ชื่อหมวดหมู่นี้มีอยู่แล้ว";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e) => {
		e.preventDefault();
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
				<h2>หมวดหมู่</h2>
			</div>

			<div className="card shadow-sm border-0">
				<div className="card-body">
					<div className="d-flex justify-content-end mb-3">
						<button className="btn btn-success" onClick={handleOpenAdd}>
							<span className="mdi mdi-plus me-1"></span> เพิ่มหมวดหมู่
						</button>
					</div>
					{isLoading ? (
						<div className="d-flex justify-content-center p-5">
							<div className="spinner-border text-primary" role="status">
								<span className="visually-hidden">Loading...</span>
							</div>
						</div>
					) : (
						<TableList
							initialTableData={categories}
							tableHeaders={[{ label: "ชื่อหมวดหมู่", key: "categoryName", align: "center" }]}
							documentName="Categories"
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
					<div className="modal-dialog">
						<div className="modal-content">
							<div className="modal-header">
								<h5 className="modal-title">{isEditMode ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</h5>
								<button type="button" className="btn-close" onClick={handleClosePopup}></button>
							</div>
							<div className="modal-body">
								<form onSubmit={handleSubmit}>
									<div className="mb-3">
										<label className="form-label">
											<span className="text-danger me-1">*</span>ชื่อหมวดหมู่
										</label>
										<input
											type="text"
											className={`form-control ${errors.categoryName ? "is-invalid" : ""}`}
											name="categoryName"
											value={formData.categoryName}
											onChange={handleChange}
											maxLength="30"
										/>
										{errors.categoryName && (
											<div className="invalid-feedback">{errors.categoryName}</div>
										)}
									</div>
								</form>
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-secondary" onClick={handleClosePopup}>
									ยกเลิก
								</button>
								<button
									type="button"
									className="btn btn-primary"
									onClick={handleSubmit}
									disabled={addMutation.isPending || updateMutation.isPending}
								>
									{(addMutation.isPending || updateMutation.isPending) && (
										<span
											className="spinner-border spinner-border-sm me-2"
											role="status"
											aria-hidden="true"
										></span>
									)}
									{isEditMode ? "บันทึก" : "เพิ่ม"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Category;
