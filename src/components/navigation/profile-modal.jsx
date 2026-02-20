import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { config } from "@constant";
import { useAlert } from "@component/alert/alert-context";
import PropTypes from "prop-types";

const ProfileModal = ({ isOpen, onClose, userId }) => {
	const { success, error: showError } = useAlert();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		userF_name: "",
		userL_name: "",
		userPhone: "",
		userEmail: "",
		userPassword: "",
		RoleID: "",
	});
	const [roleName, setRoleName] = useState("");

	const [editModes, setEditModes] = useState({
		userF_name: false,
		userL_name: false,
		userPhone: false,
		userEmail: false,
		userPassword: false,
	});

	const [showPassword, setShowPassword] = useState(false);

	const { data: user, isLoading } = useQuery({
		queryKey: ["userProfile", userId],
		queryFn: async () => {
			if (!userId) return null;
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/auth/GetUserByID/${userId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await response.json();
			if (json.statusCode === 200) {
				return json.data;
			}
			throw new Error("Failed to fetch user");
		},
		enabled: !!userId && isOpen,
	});

	const [prevUser, setPrevUser] = useState(null);
	const [prevIsOpen, setPrevIsOpen] = useState(false);

	if (user !== prevUser || isOpen !== prevIsOpen) {
		setPrevUser(user);
		setPrevIsOpen(isOpen);
		
		if (user && isOpen) {
			setFormData({
				userF_name: user.userF_name || "",
				userL_name: user.userL_name || "",
				userPhone: user.userPhone || "",
				userEmail: user.userEmail || "",
				userPassword: user.userPassword || "",
				RoleID: user.RoleID || "",
			});
			setRoleName(user.role?.RoleName || "");
			setEditModes({
				userF_name: false,
				userL_name: false,
				userPhone: false,
				userEmail: false,
				userPassword: false,
			});
		}
	}

	const updateMutation = useMutation({
		mutationFn: async (updatedData) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/auth/EditUsers/${userId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(updatedData),
			});
			const json = await response.json();
			if (json.statusCode !== 200) {
				throw new Error(json.data || "Failed to update user");
			}
			return json;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
			success("อัปเดตข้อมูลผู้ใช้งานสำเร็จ");

			// update localstorage if needed
			const fullName = formData.userL_name
				? `${formData.userF_name} ${formData.userL_name}`
				: formData.userF_name;
			localStorage.setItem("user_name", fullName);

			setEditModes({
				userF_name: false,
				userL_name: false,
				userPhone: false,
				userEmail: false,
				userPassword: false,
			});
		},
		onError: (error) => {
			showError("เกิดข้อผิดพลาดในการอัปเดต: " + error.message);
		},
	});

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const toggleEditMode = (field) => {
		setEditModes((prev) => ({ ...prev, [field]: !prev[field] }));
	};

	const formatPhoneNumber = (phone) => {
		if (!phone) return "-";
		const cleaned = ("" + phone).replace(/\D/g, "");
		const match10 = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
		if (match10) return `${match10[1]}-${match10[2]}-${match10[3]}`;
		const match9 = cleaned.match(/^(\d{2})(\d{3})(\d{4})$/);
		if (match9) return `${match9[1]}-${match9[2]}-${match9[3]}`;
		return phone;
	};

	const isEditingAny = Object.values(editModes).some((mode) => mode);

	const handleSave = () => {
		updateMutation.mutate(formData);
	};

	const handleCancelAll = () => {
		if (user) {
			setFormData({
				userF_name: user.userF_name || "",
				userL_name: user.userL_name || "",
				userPhone: user.userPhone || "",
				userEmail: user.userEmail || "",
				userPassword: user.userPassword || "",
				RoleID: user.RoleID || "",
			});
		}
		setEditModes({
			userF_name: false,
			userL_name: false,
			userPhone: false,
			userEmail: false,
			userPassword: false,
		});
	};

	if (!isOpen) return null;

	return (
		<div
			className="modal fade show d-block"
			style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
			tabIndex="-1"
		>
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title">แก้ไขข้อมูลผู้ใช้งาน</h5>
						<button type="button" className="btn-close" onClick={onClose}></button>
					</div>
					<div className="modal-body">
						{isLoading ? (
							<div className="text-center p-4">
								<div className="spinner-border text-primary"></div>
							</div>
						) : (
							<>
								<div className="mb-3 d-flex align-items-center">
									<label className="form-label mb-0" style={{ width: "120px" }}>
										ชื่อ:
									</label>
									<div className="flex-grow-1 me-2 position-relative">
										{editModes.userF_name ? (
											<input
												className="form-control"
												name="userF_name"
												value={formData.userF_name}
												onChange={handleChange}
											/>
										) : (
											<div className="form-control-plaintext">{formData.userF_name}</div>
										)}
									</div>
									<button
										className="btn btn-outline-secondary btn-sm"
										onClick={() => toggleEditMode("userF_name")}
									>
										<i className="mdi mdi-pencil"></i>
									</button>
								</div>

								<div className="mb-3 d-flex align-items-center">
									<label className="form-label mb-0" style={{ width: "120px" }}>
										นามสกุล:
									</label>
									<div className="flex-grow-1 me-2 position-relative">
										{editModes.userL_name ? (
											<input
												className="form-control"
												name="userL_name"
												value={formData.userL_name}
												onChange={handleChange}
											/>
										) : (
											<div className="form-control-plaintext">{formData.userL_name}</div>
										)}
									</div>
									<button
										className="btn btn-outline-secondary btn-sm"
										onClick={() => toggleEditMode("userL_name")}
									>
										<i className="mdi mdi-pencil"></i>
									</button>
								</div>

								<div className="mb-3 d-flex align-items-center">
									<label className="form-label mb-0" style={{ width: "120px" }}>
										เบอร์โทรศัพท์:
									</label>
									<div className="flex-grow-1 me-2 position-relative">
										{editModes.userPhone ? (
											<input
												className="form-control"
												name="userPhone"
												maxLength="10"
												value={formData.userPhone}
												onChange={(e) => {
													if (/^\d*$/.test(e.target.value)) handleChange(e);
												}}
											/>
										) : (
											<div className="form-control-plaintext">
												{formatPhoneNumber(formData.userPhone)}
											</div>
										)}
									</div>
									<button
										className="btn btn-outline-secondary btn-sm"
										onClick={() => toggleEditMode("userPhone")}
									>
										<i className="mdi mdi-pencil"></i>
									</button>
								</div>

								<div className="mb-3 d-flex align-items-center">
									<label className="form-label mb-0" style={{ width: "120px" }}>
										อีเมล:
									</label>
									<div className="flex-grow-1 me-2 position-relative">
										{editModes.userEmail ? (
											<input
												className="form-control"
												name="userEmail"
												type="email"
												value={formData.userEmail}
												onChange={handleChange}
											/>
										) : (
											<div className="form-control-plaintext">{formData.userEmail}</div>
										)}
									</div>
									<button
										className="btn btn-outline-secondary btn-sm"
										onClick={() => toggleEditMode("userEmail")}
									>
										<i className="mdi mdi-pencil"></i>
									</button>
								</div>

								<div className="mb-3 d-flex align-items-center">
									<label className="form-label mb-0" style={{ width: "120px" }}>
										รหัสผ่าน:
									</label>
									<div className="flex-grow-1 me-2 position-relative">
										{editModes.userPassword ? (
											<div className="position-relative">
												<input
													className="form-control"
													name="userPassword"
													type={showPassword ? "text" : "password"}
													value={formData.userPassword}
													onChange={handleChange}
													style={{ paddingRight: "35px" }}
												/>
												<span
													className={`mdi ${
														showPassword ? "mdi-eye-outline" : "mdi-eye-off-outline"
													} position-absolute`}
													onClick={() => setShowPassword(!showPassword)}
													style={{
														right: "10px",
														top: "50%",
														transform: "translateY(-50%)",
														cursor: "pointer",
														color: "#6c757d",
													}}
												></span>
											</div>
										) : (
											<div className="form-control-plaintext">********</div>
										)}
									</div>
									<button
										className="btn btn-outline-secondary btn-sm"
										onClick={() => toggleEditMode("userPassword")}
									>
										<i className="mdi mdi-pencil"></i>
									</button>
								</div>

								<div className="mb-3 d-flex align-items-center">
									<label className="form-label mb-0" style={{ width: "120px" }}>
										สิทธิ์การใช้งาน:
									</label>
									<div className="flex-grow-1 me-2">
										<div className="form-control-plaintext">{roleName}</div>
									</div>
									<button
										className="btn btn-sm btn-outline-secondary invisible"
										tabIndex="-1"
										aria-hidden="true"
									>
										<i className="mdi mdi-pencil"></i>
									</button>
								</div>
							</>
						)}

						{isEditingAny && (
							<div className="d-flex justify-content-end mt-4">
								<button
									className="btn btn-outline-secondary me-2"
									onClick={handleCancelAll}
									disabled={updateMutation.isPending}
								>
									ยกเลิก
								</button>
								<button
									className="btn btn-primary"
									onClick={handleSave}
									disabled={updateMutation.isPending}
								>
									{updateMutation.isPending ? (
										<span className="spinner-border spinner-border-sm"></span>
									) : (
										"บันทึก"
									)}
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

ProfileModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	userId: PropTypes.string,
};

export default ProfileModal;
