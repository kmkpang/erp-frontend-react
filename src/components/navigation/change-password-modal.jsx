import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { config } from "@constant";
import { useAlert } from "@component/alert/alert-context";
import PropTypes from "prop-types";
import { fetchApi } from "@utils/api";

const ChangePasswordModal = ({ isOpen, onClose, userId }) => {
	const { success, error: showError } = useAlert();
	const navigate = useNavigate();

	const [formData, setFormData] = useState({
		oldPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [showOldPassword, setShowOldPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const [prevIsOpen, setPrevIsOpen] = useState(false);

	// Reset form when modal opens
	if (isOpen !== prevIsOpen) {
		setPrevIsOpen(isOpen);
		if (isOpen) {
			setFormData({
				oldPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
			setShowOldPassword(false);
			setShowNewPassword(false);
			setShowConfirmPassword(false);
		}
	}

	const passwordMutation = useMutation({
		mutationFn: async (data) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetchApi(`${config.url}/auth/ChangePassword/${userId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(data),
			});
			const json = await response.json();
			if (json.statusCode !== 200) {
				throw new Error(json.data || "Failed to change password");
			}
			return json;
		},
		onSuccess: () => {
			success("เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบใหม่");
			onClose();
			localStorage.clear();
			navigate("/login");
		},
		onError: (error) => {
			showError(error.message);
		},
	});

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSave = () => {
		if (!formData.oldPassword) {
			return showError("กรุณากรอกรหัสผ่านเดิม");
		}
		if (!formData.newPassword) {
			return showError("กรุณากรอกรหัสผ่านใหม่");
		}
		if (formData.newPassword !== formData.confirmPassword) {
			return showError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
		}
		if (formData.newPassword.length < 6) {
			return showError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
		}

		passwordMutation.mutate({
			oldPassword: formData.oldPassword,
			newPassword: formData.newPassword,
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
						<h5 className="modal-title">เปลี่ยนรหัสผ่าน</h5>
						<button type="button" className="btn-close" onClick={onClose}></button>
					</div>
					<div className="modal-body">
						<div className="mb-3 d-flex align-items-center">
							<label className="form-label mb-0" style={{ width: "150px" }}>
								รหัสผ่านเดิม:
							</label>
							<div className="flex-grow-1 position-relative">
								<input
									className="form-control"
									name="oldPassword"
									type={showOldPassword ? "text" : "password"}
									value={formData.oldPassword}
									onChange={handleChange}
									style={{ paddingRight: "35px" }}
								/>
								<span
									className={`mdi ${
										showOldPassword ? "mdi-eye-outline" : "mdi-eye-off-outline"
									} position-absolute`}
									onClick={() => setShowOldPassword(!showOldPassword)}
									style={{
										right: "10px",
										top: "50%",
										transform: "translateY(-50%)",
										cursor: "pointer",
										color: "#6c757d",
									}}
								></span>
							</div>
						</div>

						<div className="mb-3 d-flex align-items-center">
							<label className="form-label mb-0" style={{ width: "150px" }}>
								รหัสผ่านใหม่:
							</label>
							<div className="flex-grow-1 position-relative">
								<input
									className="form-control"
									name="newPassword"
									type={showNewPassword ? "text" : "password"}
									value={formData.newPassword}
									onChange={handleChange}
									style={{ paddingRight: "35px" }}
								/>
								<span
									className={`mdi ${
										showNewPassword ? "mdi-eye-outline" : "mdi-eye-off-outline"
									} position-absolute`}
									onClick={() => setShowNewPassword(!showNewPassword)}
									style={{
										right: "10px",
										top: "50%",
										transform: "translateY(-50%)",
										cursor: "pointer",
										color: "#6c757d",
									}}
								></span>
							</div>
						</div>

						<div className="mb-3 d-flex align-items-center">
							<label className="form-label mb-0" style={{ width: "150px" }}>
								ยืนยันรหัสผ่านใหม่:
							</label>
							<div className="flex-grow-1 position-relative">
								<input
									className="form-control"
									name="confirmPassword"
									type={showConfirmPassword ? "text" : "password"}
									value={formData.confirmPassword}
									onChange={handleChange}
									style={{ paddingRight: "35px" }}
								/>
								<span
									className={`mdi ${
										showConfirmPassword ? "mdi-eye-outline" : "mdi-eye-off-outline"
									} position-absolute`}
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									style={{
										right: "10px",
										top: "50%",
										transform: "translateY(-50%)",
										cursor: "pointer",
										color: "#6c757d",
									}}
								></span>
							</div>
						</div>

						<div className="d-flex justify-content-end mt-4">
							<button
								className="btn btn-outline-secondary me-2"
								onClick={onClose}
								disabled={passwordMutation.isPending}
							>
								ยกเลิก
							</button>
							<button
								className="btn btn-primary"
								onClick={handleSave}
								disabled={passwordMutation.isPending}
							>
								{passwordMutation.isPending ? (
									<span className="spinner-border spinner-border-sm"></span>
								) : (
									"บันทึกรหัสผ่าน"
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

ChangePasswordModal.propTypes = {
	isOpen: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	userId: PropTypes.string,
};

export default ChangePasswordModal;
