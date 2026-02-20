import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { config } from "@constant";
import { useAlert } from "@component/alert/alert-context";
import PropTypes from "prop-types";
import { fetchApi } from "@utils/api";

const ProfileModal = ({ isOpen, onClose, userId }) => {
	const { success, error: showError } = useAlert();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		userF_name: "",
		userL_name: "",
		userPhone: "",
		userEmail: "",
		RoleID: "",
	});
	const [roleName, setRoleName] = useState("");

	const [isEditingAll, setIsEditingAll] = useState(false);

	const { data: user, isLoading } = useQuery({
		queryKey: ["userProfile", userId],
		queryFn: async () => {
			if (!userId) return null;
			const token = localStorage.getItem("@accessToken");
			const response = await fetchApi(`${config.url}/auth/GetUserByID/${userId}`, {
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
				RoleID: user.RoleID || "",
			});
			setRoleName(user.role?.RoleName || "");
			setIsEditingAll(false);
		}
	}

	const updateMutation = useMutation({
		mutationFn: async (updatedData) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetchApi(`${config.url}/auth/EditUsers/${userId}`, {
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

			setIsEditingAll(false);
		},
		onError: (error) => {
			showError("เกิดข้อผิดพลาดในการอัปเดต: " + error.message);
		},
	});

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
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
				RoleID: user.RoleID || "",
			});
		}
		setIsEditingAll(false);
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
						<h5 className="modal-title">ข้อมูลผู้ใช้งาน</h5>
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
										{isEditingAll ? (
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
								</div>

								<div className="mb-3 d-flex align-items-center">
									<label className="form-label mb-0" style={{ width: "120px" }}>
										นามสกุล:
									</label>
									<div className="flex-grow-1 me-2 position-relative">
										{isEditingAll ? (
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
								</div>

								<div className="mb-3 d-flex align-items-center">
									<label className="form-label mb-0" style={{ width: "120px" }}>
										เบอร์โทรศัพท์:
									</label>
									<div className="flex-grow-1 me-2 position-relative">
										{isEditingAll ? (
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
								</div>

								<div className="mb-3 d-flex align-items-center">
									<label className="form-label mb-0" style={{ width: "120px" }}>
										อีเมล:
									</label>
									<div className="flex-grow-1 me-2 position-relative">
										{isEditingAll ? (
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
								</div>

								<div className="mb-3 d-flex align-items-center">
									<label className="form-label mb-0" style={{ width: "120px" }}>
										สิทธิ์การใช้งาน:
									</label>
									<div className="flex-grow-1 me-2">
										<div className="form-control-plaintext">{roleName}</div>
									</div>
								</div>
							</>
						)}

						<div className="d-flex justify-content-end mt-4">
							{isEditingAll ? (
								<>
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
								</>
							) : (
								<button
									className="btn btn-primary"
									onClick={() => setIsEditingAll(true)}
								>
									แก้ไขข้อมูล
								</button>
							)}
						</div>
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
