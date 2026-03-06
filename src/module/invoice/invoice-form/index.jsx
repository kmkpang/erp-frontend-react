import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import SearchableSelect from "@component/searchable-select";
import DatePickerThai from "@component/date-picker-thai";
import { config } from "@constant";
import { useAlert } from "@component/alert/alert-context";
import { fetchApi } from "@utils/api";

const getInitialFormState = () => ({
  inv_num: "HD",
  inv_date: new Date().toISOString().slice(0, 10),
  cus_id: "",
  cus_name: "",
  cus_address: "",
  cus_tel: "",
  cus_tax: "",
  productForms: [],
  remark: "",
  remarkInfernal: "",
  vatType: "non-vat", // non-vat, included-vat, excluded-vat
  total_grand: 0,
  vat: 0,
  grand_total: 0,
  credit_date_number: 30, // Default 30 days
  credit_expired_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  status: "Pending", // Default
  bus_id: localStorage.getItem("@bus_id"),
  employeeID: localStorage.getItem("user_id"),
  employeeName: localStorage.getItem("user_name"),
  deposit_type: "full", // "full" or "deposit"
  deposit_amount: "",
  deposit_percent: "",
});

const InvoiceFormModal = ({
  isOpen,
  onClose,
  initialData,
  isEditMode,
  idEditing,
  customerOptions,
  productOptions,
  businessData,
  onSaveSuccess,
}) => {
  const queryClient = useQueryClient();
  const { success, error } = useAlert();

  // Deposit Summary State
  const [depositSummary, setDepositSummary] = useState(null);
  const [loadingDeposit, setLoadingDeposit] = useState(false);

  // Fetch Pending Quotations
  const { data: quotations = [] } = useQuery({
    // Default to empty array
    queryKey: ["quotations", "pending"],
    queryFn: async () => {
      const res = await fetchApi(`${config.url}/Quotation/getQuotation`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch quotations");
      const json = await res.json();
      // Filter only Pending or Allowed?
      // The user wants to create from valid quotations.
      // Usually we filter out those already invoiced.
      // Assuming "status" field helps.
      // But let's return all and filter client side for better control or if status logic is complex.
      return json.data || [];
    },
    enabled: !isEditMode, // Only fetch when creating new
  });

  const pendingQuotations = React.useMemo(() => {
    if (!quotations) return [];
    return quotations.filter(
      (q) => q.status !== "Billed" && q.status !== "Cancel"
      // "DepositBilled" is intentionally allowed so a final invoice can be created
      // after a deposit receipt has been issued
    );
  }, [quotations]);

  const [formData, setFormData] = useState(() => {
    if (initialData && isEditMode) {
      // Prefer sale_totalprice as the authoritative pre-VAT subtotal.
      // Falling back to sum of detail lines only when sale_totalprice is unavailable.
      const total =
        parseFloat(initialData.sale_totalprice) ||
        (initialData.details || []).reduce(
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
          price: parseFloat(p.price || p.sale_price / (p.sale_qty || 1)) || 0,
          description: p.description || p.product_detail || "",
          sale_price: parseFloat(p.sale_price) || (parseFloat(p.price || 0) * (p.sale_qty || 1)),
        })),
        inv_date: initialData.invoice_date ? initialData.invoice_date.slice(0, 10) : "",
        inv_num: initialData.invoice_number || "HD",
        credit_expired_date: initialData.credit_expired_date
          ? initialData.credit_expired_date.slice(0, 10)
          : "",
        cus_id: initialData.cus_id || "",
        bus_id: initialData.bus_id || localStorage.getItem("@bus_id"),
        employeeID: initialData.employeeID || localStorage.getItem("user_id"),
        grand_total: grandTotal || 0,
        vat: vat,
        total_grand: initialData.sale_totalprice || 0,
        remark: initialData.invoice_remark || initialData.remark || "",
      };
    }
    return getInitialFormState();
  });

  // Recalculate totals on initial load to ensure VAT and Grand Total are derived correctly
  useEffect(() => {
    if (isEditMode && initialData) {
      const products = formData.productForms || [];
      const vatType = formData.vatType || "non-vat";

      const total = products.reduce((sum, p) => sum + (parseFloat(p.sale_price) || 0), 0);
      let vatAmt = 0;
      let gTotal = total;

      if (vatType === "included-vat") {
        vatAmt = (total * 7) / 107;
      } else if (vatType === "excluded-vat") {
        vatAmt = total * 0.07;
        gTotal = total + vatAmt;
      }

      setFormData((prev) => ({
        ...prev,
        vat: vatAmt,
        grand_total: gTotal,
        total_grand: total
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, initialData]);

  const isDerivedFromQuotation = !!formData.sale_id && (!formData.quotation_num || !String(formData.quotation_num).includes("QT-AUTO"));

  // Handle Quotation Selection
  const handleQuotationSelect = async (quotation) => {
    if (!quotation) return;

    // Extract deposit percentage from remark
    let defaultDepositPercent = "";
    let defaultDepositAmount = "";
    if (quotation.remark) {
      const depositMatch = quotation.remark.match(/2\. มัดจําค่าสินค้า (.*?)%/);
      if (depositMatch && depositMatch[1]) {
        const pct = parseFloat(depositMatch[1]);
        if (!isNaN(pct)) {
          defaultDepositPercent = pct;
          defaultDepositAmount = ((quotation.sale_totalprice || 0) * pct) / 100;
        }
      }
    }

    // Map Quotation Data to Invoice Form
    setFormData((prev) => ({
      ...prev,
      sale_id: quotation.sale_id,
      quotation_num: quotation.sale_number || quotation.quotation_num,
      cus_id: quotation.cus_id,
      cus_name: quotation.cus_name,
      cus_address: quotation.cus_address,
      cus_tel: quotation.cus_tel,
      cus_tax: quotation.cus_tax,
      vatType: quotation.vatType || "non-vat",
      // Remap products/details
      productForms: (quotation.products || quotation.details || []).map((p) => ({
        ...p,
        productname: p.productname || p.productName || "",
        productID: p.productID,
        unit: p.unit || p.pro_unti || "",
        sale_qty: p.sale_qty || 1,
        price: p.price || 0,
        description: p.description || p.product_detail || "",
        sale_price: p.sale_price || 0,
      })),
      // Carry over quotation total
      total_grand: parseFloat(quotation.sale_totalprice || 0),
      deposit_type: "full",
      deposit_amount: defaultDepositAmount !== "" ? defaultDepositAmount.toFixed(2) : "",
      deposit_percent: defaultDepositPercent !== "" ? defaultDepositPercent : "",
    }));

    // Re-calculate VAT based on the imported total
    const total = parseFloat(quotation.sale_totalprice || 0);
    const vatType = quotation.vatType || "non-vat";
    let vatAmt = 0;
    let gTotal = total;
    if (vatType === "included-vat") {
      vatAmt = (total * 7) / 107;
    } else if (vatType === "excluded-vat") {
      vatAmt = total * 0.07;
      gTotal = total + vatAmt;
    }

    setFormData((prev) => ({
      ...prev,
      vat: vatAmt,
      grand_total: gTotal,
    }));


    // Fetch deposit summary for this quotation
    try {
      setLoadingDeposit(true);
      const res = await fetchApi(`${config.url}/Invoice/getDepositSummary/${quotation.sale_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("@accessToken")}` },
      });
      if (res.ok) {
        const json = await res.json();
        setDepositSummary(json.data);
      }
    } catch {
      setDepositSummary(null);
    } finally {
      setLoadingDeposit(false);
    }
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
        inv_num: newData.inv_num,
        inv_date: newData.inv_date,
        cus_id: newData.cus_id || null,
        bus_id:
          newData.bus_id ||
          businessData?.business?.bus_id ||
          businessData?.bus_id ||
          localStorage.getItem("@bus_id"),
        employeeID: employeeID,
        remark: newData.remark,
        remarkInfernal: newData.remarkInfernal,
        total_grand: newData.total_grand,
        vatType: newData.vatType,
        credit_date_number: newData.credit_date_number,
        credit_expired_date: newData.credit_expired_date,
        status: newData.status,
        products: products,
        sale_id: newData.sale_id || null, // Include sale_id
        deposit_type: newData.deposit_type || "full",
        deposit_amount: newData.deposit_type === "deposit" ? parseFloat(newData.deposit_amount) || null : null,
      };

      const res = await fetchApi(`${config.url}/Invoice/createInvoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("@accessToken")}`,
        },
        body: JSON.stringify(requestBody),
      });
      const json = await res.json();
      if (!res.ok || (json.statusCode !== 200 && json.statusCode !== 201)) {
        const errorMessage =
          json.message ||
          (typeof json.data === "string" ? json.data : JSON.stringify(json.data)) ||
          "Failed to add invoice";
        throw new Error(errorMessage);
      }
      return json;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["quotations"]);
      onClose();
      success("เพิ่มข้อมูลสำเร็จ");
      if (onSaveSuccess) {
        const mergedData = { ...formData, ...(data?.data || {}) };
        // Inject total_deposited so the PDF immediately shows deduction for full invoices
        if (depositSummary && depositSummary.total_deposit_paid > 0) {
          mergedData.total_deposited = depositSummary.total_deposit_paid;
        }
        onSaveSuccess(mergedData);
      }
    },
    onError: (err) => {
      error(err.message, "เพิ่มข้อมูลล้มเหลว");
    },
  });

  // Initialize remark from business data if new
  React.useEffect(() => {
    if (!isEditMode && !formData.remark && businessData) {
      const banks = businessData?.business?.banks || businessData?.banks || [];
      if (banks.length > 0) {
        const bank = banks[0];
        // Format matching user request: "โอนเงินชําระค่าสินค้า ที่ ..."
        const bankStr = `${bank.bank_name ? "ธนาคาร" + bank.bank_name : ""} ( ${bank.bank_account || ""
          } ) ${bank.bank_number || ""}`;

        setFormData((prev) => ({
          ...prev,
          remark: `โอนเงินชําระค่าสินค้า ที่ ${bankStr}`,
        }));
      }
    }

    // Ensure bus_id is set if available
    if (!formData.bus_id && businessData) {
      const busId =
        businessData.business?.bus_id || businessData.bus_id || localStorage.getItem("@bus_id");
      if (busId) {
        setFormData((prev) => ({ ...prev, bus_id: busId }));
      }
    }
  }, [isEditMode, initialData, businessData, formData.remark, formData.bus_id]);

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
        total_grand: updatedData.total_grand,
        products: products,
      };

      const res = await fetchApi(`${config.url}/Invoice/editInvoice/${idEditing}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("@accessToken")}`,
        },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) throw new Error("Failed to update invoice");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["invoices"]);
      onClose();
      success("แก้ไขข้อมูลสำเร็จ");
      if (onSaveSuccess) {
        const mergedData = { ...formData, ...(data?.data || {}) };
        onSaveSuccess(mergedData);
      }
    },
    onError: (err) => {
      error("เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + err.message, "แก้ไขข้อมูลล้มเหลว");
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "deposit_amount") {
      const amount = parseFloat(value) || 0;
      const total = parseFloat(formData.total_grand) || 0;
      let percent = "";
      if (total > 0) {
        percent = ((amount / total) * 100).toFixed(2);
      }
      setFormData((prev) => ({ ...prev, deposit_amount: value, deposit_percent: percent }));
    } else if (name === "deposit_percent") {
      const percent = parseFloat(value) || 0;
      const total = parseFloat(formData.total_grand) || 0;
      let amount = "";
      if (total > 0) {
        amount = ((total * percent) / 100).toFixed(2);
      }
      setFormData((prev) => ({ ...prev, deposit_percent: value, deposit_amount: amount }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
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
      total_grand: total, // Matches `total_grand`
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
            <h5 className="modal-title">{isEditMode ? "แก้ไขใบแจ้งหนี้" : "สร้างใบแจ้งหนี้"}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleFormSubmit}>
            <div className="modal-body">
              {/* Select Quotation (Only in Create Mode) */}
              {!isEditMode && (
                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label text-primary">
                      สร้างจากใบเสนอราคา (เลือกรายการ):
                    </label>
                    <SearchableSelect
                      options={pendingQuotations}
                      value={formData.sale_id || ""}
                      labelKey="quotation_num"
                      valueKey="sale_id"
                      onChange={(val) => {
                        const selected = pendingQuotations.find((q) => q.sale_id === val);
                        handleQuotationSelect(selected);
                      }}
                      placeholder="-- เลือกใบเสนอราคาเพื่อดึงข้อมูล --"
                    />
                  </div>

                  {/* Deposit Type Selector — shows only when quotation is selected */}
                  {formData.sale_id && (
                    <div className="col-md-12 mt-3">
                      <div className="card border-primary">
                        <div className="card-body py-3">
                          <label className="form-label fw-bold">ประเภทใบแจ้งหนี้:</label>
                          <div className="d-flex gap-3 mb-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="deposit_type"
                                id="deposit_type_full"
                                value="full"
                                checked={formData.deposit_type === "full"}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label" htmlFor="deposit_type_full">
                                ยอดเต็ม
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="deposit_type"
                                id="deposit_type_deposit"
                                value="deposit"
                                checked={formData.deposit_type === "deposit"}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label" htmlFor="deposit_type_deposit">
                                ค่ามัดจำ
                              </label>
                            </div>
                          </div>

                          {/* Deposit Amount & Percent Inputs */}
                          {formData.deposit_type === "deposit" && (
                            <div className="row mb-2 g-3">
                              <div className="col-md-6">
                                <label className="form-label">เปอร์เซ็นต์มัดจำ (%):</label>
                                <div className="input-group">
                                  <input
                                    type="number"
                                    className="form-control"
                                    name="deposit_percent"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={formData.deposit_percent}
                                    onChange={handleInputChange}
                                    placeholder="กรอกเปอร์เซ็นต์"
                                    required
                                  />
                                  <span className="input-group-text">%</span>
                                </div>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label">ยอดมัดจำ (บาท):</label>
                                <div className="input-group">
                                  <input
                                    type="number"
                                    className="form-control"
                                    name="deposit_amount"
                                    min="0"
                                    step="0.01"
                                    max={parseFloat(formData.total_grand) || undefined}
                                    value={formData.deposit_amount}
                                    onChange={handleInputChange}
                                    placeholder="กรอกยอดมัดจำ"
                                    required
                                  />
                                  <span className="input-group-text">บาท</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Deposit Summary Box */}
                          {loadingDeposit && <div className="text-muted small">กำลังโหลดข้อมูลมัดจำ...</div>}
                          {depositSummary && !loadingDeposit && (
                            <div className="mt-2 p-2 bg-light rounded border">
                              <div className="row text-sm">
                                <div className="col-6">ยอดรวมใบเสนอราคา:</div>
                                <div className="col-6 text-end fw-bold">{parseFloat(depositSummary.total_amount).toLocaleString()} บาท</div>
                                <div className="col-6 text-warning">มัดจำที่จ่ายแล้ว:</div>
                                <div className="col-6 text-end text-warning fw-bold">-{parseFloat(depositSummary.total_deposit_paid).toLocaleString()} บาท</div>
                                <div className="col-6 text-success fw-bold">ยอดคงเหลือ:</div>
                                <div className="col-6 text-end text-success fw-bold">{parseFloat(depositSummary.remaining_balance).toLocaleString()} บาท</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="col-md-12">
                    <hr />
                  </div>
                </div>
              )}
              {/* Header Info */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">เลขที่ใบแจ้งหนี้:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="inv_num"
                    value={formData.inv_num}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">วันที่:</label>
                  <DatePickerThai
                    className="form-control"
                    name="inv_date"
                    value={formData.inv_date}
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
                    value={formData.cus_name || ""}
                    labelKey="cus_name"
                    valueKey="cus_name"
                    onChange={(val) => {
                      handleCustomerChange({ target: { value: val } });
                    }}
                    placeholder="กรุณากรอกชื่อบริษัท/ชื่อลูกค้า"
                    disabled={isDerivedFromQuotation}
                  />
                </div>
                <div className="col-md-12 mt-2">
                  <label className="form-label">ที่อยู่บริษัท/ลูกค้า:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="cus_address"
                    value={formData.cus_address || ""}
                    onChange={handleInputChange}
                    placeholder="กรุณากรองที่อยู่"
                    disabled={isDerivedFromQuotation}
                  />
                </div>
                <div className="col-md-12 mt-2">
                  <label className="form-label">เบอร์โทรศัพท์:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="cus_tel"
                    value={formData.cus_tel || ""}
                    onChange={handleInputChange}
                    placeholder="กรุณากรอกเบอร์โทรศัพท์"
                    disabled={isDerivedFromQuotation}
                  />
                </div>
                <div className="col-md-12 mt-2">
                  <label className="form-label">เลขประจำตัวผู้เสียภาษี:</label>
                  <input
                    type="text"
                    className="form-control"
                    name="cus_tax"
                    value={formData.cus_tax || ""}
                    onChange={handleInputChange}
                    placeholder="กรุณากรอกเลขประจำตัวผู้เสียภาษี"
                    disabled={isDerivedFromQuotation}
                  />
                </div>
              </div>

              <hr />

              {/* Products */}
              <div className="mb-3">
                <label className="form-label d-flex justify-content-between">
                  <span>รายการสินค้า</span>
                  <button type="button" className="btn btn-sm btn-primary" onClick={addProductRow} disabled={isDerivedFromQuotation}>
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
                                disabled={isDerivedFromQuotation}
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
                                disabled={isDerivedFromQuotation}
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
                                disabled={isDerivedFromQuotation}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                value={product.unit}
                                onChange={(e) => handleProductChange(index, "unit", e.target.value)}
                                disabled={isDerivedFromQuotation}
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
                                disabled={isDerivedFromQuotation}
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
                                  disabled={isDerivedFromQuotation}
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
                        value={parseFloat(formData.total_grand).toFixed(2)}
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

export default InvoiceFormModal;
