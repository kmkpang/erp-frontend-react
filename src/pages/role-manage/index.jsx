import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TableList from "@component/table-list";
import { config } from "@constant";

const RoleManage = () => {
	const queryClient = useQueryClient();
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [formData, setFormData] = useState({
		RoleID: "",
		RoleName: "",
	});
	const [errors, setErrors] = useState({});

	const { data: roles = [], isLoading } = useQuery({
		queryKey: ["roles"],
		queryFn: async () => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/auth/GetRole`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await response.json();
			if (json.statusCode === 200) {
				return json.data;
			}
			throw new Error("Failed to fetch roles");
		},
	});

	const addMutation = useMutation({
		mutationFn: async (newData) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/auth/AddRole`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ RoleName: newData.RoleName }),
			});
			const json = await response.json();
			if (json.statusCode !== 200) {
				throw new Error(json.data || "Failed to add role");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roles"] });
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
			const response = await fetch(`${config.url}/auth/EditRole/${updatedData.RoleID}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ RoleName: updatedData.RoleName }),
			});
			const json = await response.json();
			if (json.statusCode !== 200) {
				throw new Error(json.data || "Failed to update role");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roles"] });
			handleClosePopup();
			alert("แก้ไขข้อมูลสำเร็จ");
		},
		onError: (error) => {
			alert("เกิดข้อผิดพลาด: " + error.message);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (RoleID) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/auth/DeleteRole/${RoleID}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ RoleID }),
			});
			const json = await response.json();
			if (json.statusCode !== 200) {
				throw new Error(json.data || "Failed to delete role");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roles"] });
			alert("ลบข้อมูลสำเร็จ");
		},
		onError: (error) => {
			alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
		},
	});

	const handleOpenAdd = () => {
		setFormData({ RoleID: "", RoleName: "" });
		setErrors({});
		setIsEditMode(false);
		setIsPopupOpen(true);
	};

	const handleEdit = (item) => {
		setFormData({
			RoleID: item.RoleID,
			RoleName: item.RoleName,
		});
		setErrors({});
		setIsEditMode(true);
		setIsPopupOpen(true);
	};

	const handleDelete = (item) => {
		const RoleID = item.RoleID;
		if (window.confirm(`คุณต้องการลบสิทธิ์ "${item.RoleName}" ใช่หรือไม่?`)) {
			deleteMutation.mutate(RoleID);
		}
	};

	const handleClosePopup = () => {
		setIsPopupOpen(false);
		setFormData({ RoleID: "", RoleName: "" });
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
		if (!formData.RoleName.trim()) {
			newErrors.RoleName = "กรุณาระบุชื่อสิทธิ์ผู้ใช้งาน";
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
				<h2>สิทธิ์ผู้ใช้งาน</h2>
			</div>

			<div className="card shadow-sm border-0">
				<div className="card-body">
					<div className="d-flex justify-content-end mb-3">
						<button className="btn btn-success" onClick={handleOpenAdd}>
							<span className="mdi mdi-plus me-1"></span> เพิ่มสิทธิ์ผู้ใช้งาน
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
							initialTableData={roles}
							tableHeaders={[{ label: "ชื่อสิทธิ์ผู้ใช้งาน", key: "RoleName", align: "center" }]}
							documentName="Roles"
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
								<h5 className="modal-title">
									{isEditMode ? "แก้ไขสิทธิ์ผู้ใช้งาน" : "เพิ่มสิทธิ์ผู้ใช้งาน"}
								</h5>
								<button type="button" className="btn-close" onClick={handleClosePopup}></button>
							</div>
							<div className="modal-body">
								<form onSubmit={handleSubmit}>
									<div className="mb-3">
										<label className="form-label">
											<span className="text-danger me-1">*</span>ชื่อสิทธิ์ผู้ใช้งาน
										</label>
										<input
											type="text"
											className={`form-control ${errors.RoleName ? "is-invalid" : ""}`}
											name="RoleName"
											value={formData.RoleName}
											onChange={handleChange}
										/>
										{errors.RoleName && <div className="invalid-feedback">{errors.RoleName}</div>}
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

export default RoleManage;
