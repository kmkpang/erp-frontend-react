import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TableList from "@component/table-list";
import { config } from "@constant";
import ProductFormModal from "@module/product/product-form-modal";
import DeleteModal from "@module/product/delete-modal";
import { useAlert } from "@component/alert/alert-context";

const Product = () => {
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState("product"); // "product" or "service"
	const [searchTerm, setSearchTerm] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState(null);

	const { success, error: showError } = useAlert();

	const { data: products = [], isLoading: isProductsLoading } = useQuery({
		queryKey: ["products"],
		queryFn: async () => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/product/getProduct`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await response.json();
			if (json.statusCode === 200) {
				return json.data;
			}
			throw new Error("Failed to fetch products");
		},
	});

	// ... categories query ...
	const { data: categories = [] } = useQuery({
		queryKey: ["productCategories"],
		queryFn: async () => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/product/getCategory`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			const json = await response.json();
			if (json.statusCode === 200) {
				return json.data;
			}
			return [];
		},
	});

	// ... mutations ...
	const createMutation = useMutation({
		mutationFn: async (formData) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/product/AddProduct`, {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.message || "Failed to create product");
			}
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(["products"]);
			setIsModalOpen(false);
			success("เพิ่มสินค้าสำเร็จ");
		},
		onError: (error) => {
			showError(`Error: ${error.message}`);
		},
	});

	const updateMutation = useMutation({
		mutationFn: async ({ id, formData }) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/product/EditProduct/${id}`, {
				method: "PUT",
				headers: { Authorization: `Bearer ${token}` },
				body: formData,
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.message || "Failed to update product");
			}
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(["products"]);
			setIsModalOpen(false);
			setSelectedProduct(null);
			success("แก้ไขสินค้าสำเร็จ");
		},
		onError: (error) => {
			showError(`Error: ${error.message}`);
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const token = localStorage.getItem("@accessToken");
			const response = await fetch(`${config.url}/product/DeleteProduct/${id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});

			const result = await response.json();
			if (!response.ok) {
				throw new Error(result.message || "Failed to delete product");
			}
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries(["products"]);
			setIsDeleteModalOpen(false);
			setSelectedProduct(null);
			success("ลบสินค้าสำเร็จ");
		},
		onError: (error) => {
			showError(`Error: ${error.message}`);
		},
	});

	const handleCreate = () => {
		setSelectedProduct(null);
		setIsModalOpen(true);
	};

	const handleEdit = (product) => {
		setSelectedProduct(product);
		setIsModalOpen(true);
	};

	const handleDeleteRequest = (product) => {
		setSelectedProduct(product);
		setIsDeleteModalOpen(true);
	};

	const handleConfirmDelete = () => {
		if (selectedProduct) {
			deleteMutation.mutate(selectedProduct.productID);
		}
	};

	const handleSave = (formData) => {
		if (selectedProduct) {
			updateMutation.mutate({ id: selectedProduct.productID, formData });
		} else {
			createMutation.mutate(formData);
		}
	};

	// Filter products based on activeTab and searchTerm
	const filteredProducts = products.filter((product) => {
		const matchesSearch = product.productname.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesType =
			activeTab === "product" ? product.productTypeID === 1 : product.productTypeID === 2;
		return matchesSearch && matchesType;
	});

	const tableHeaders = [
		{ label: "รูป", key: "productImg" },
		{ label: "ชื่อ", key: "productname" },
		{
			label: "ราคา",
			key: "price",
			render: (value) => `${value.toLocaleString()} บาท`,
			align: "right",
		},
		{ label: "รายละเอียด", key: "productdetail" },
	];

	const initialFormData = selectedProduct || { productTypeID: activeTab === "product" ? 1 : 2 };

	return (
		<div className="container-fluid">
			<h2 className="mb-4">{activeTab === "product" ? "สินค้า" : "บริการ"}</h2>

			<div className="card shadow-sm border-0">
				<div className="card-header bg-white border-0 py-3">
					{/* Tabs */}
					<div className="w-full mb-4">
						<div className="btn-group w-full" role="group">
							<button
								type="button"
								className={`btn ${activeTab === "product" ? "btn-primary" : "btn-outline-primary"}`}
								onClick={() => setActiveTab("product")}
								style={{ minWidth: "120px" }}
							>
								สินค้า
							</button>
							<button
								type="button"
								className={`btn ${activeTab === "service" ? "btn-primary" : "btn-outline-primary"}`}
								onClick={() => setActiveTab("service")}
								style={{ minWidth: "120px" }}
							>
								บริการ
							</button>
						</div>
					</div>

					<div className="d-flex justify-content-between align-items-center">
						<div className="d-flex gap-2">
							<input
								type="text"
								className="form-control"
								placeholder={`ค้นหา${activeTab === "product" ? "สินค้า" : "บริการ"}...`}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								style={{ maxWidth: "300px" }}
							/>
						</div>
						<button className="btn btn-primary" onClick={handleCreate}>
							<i className="mdi mdi-plus me-1"></i>{" "}
							{activeTab === "product" ? "เพิ่มสินค้า" : "เพิ่มบริการ"}
						</button>
					</div>
				</div>
				<div className="card-body">
					{isProductsLoading ? (
						<div className="text-center p-4">
							<div className="spinner-border text-primary" role="status">
								<span className="visually-hidden">Loading...</span>
							</div>
						</div>
					) : (
						<TableList
							initialTableData={filteredProducts}
							tableHeaders={tableHeaders}
							documentName={activeTab === "product" ? "Products" : "Services"}
							columnEditAndDelete
							onEdit={handleEdit}
							onDelete={handleDeleteRequest}
						/>
					)}
				</div>
			</div>

			<ProductFormModal
				key={
					isModalOpen
						? selectedProduct
							? selectedProduct.productID
							: `create-${activeTab}`
						: "closed"
				}
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleSave}
				initialData={initialFormData}
				categories={categories}
			/>

			<DeleteModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={handleConfirmDelete}
				title="ยืนยันการลบสินค้า"
				message={
					selectedProduct
						? `คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${selectedProduct.productname}"?`
						: ""
				}
				onConfirmText="ลบสินค้า"
			/>
		</div>
	);
};
export default Product;
