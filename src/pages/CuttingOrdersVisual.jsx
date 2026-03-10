// pages/CuttingOrdersPage.jsx
import { useEffect, useState, useMemo } from "react";
import {
	Button, InputNumber, Select, Modal, message, Input,
	Row, Col, Space, Upload, Tag, Tooltip, Drawer,
	Timeline, Spin, Empty, Divider, Alert, Table,
} from "antd";
import {
	UploadOutlined, PlusOutlined, PercentageOutlined, TagOutlined,
	SearchOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
	CloseCircleOutlined, ExclamationCircleOutlined, ReloadOutlined,
} from "@ant-design/icons";

import {
	useGetOrdersQuery,
	useCreateOrderMutation,
	useChangeOrderStatusMutation,
	useGetClientHistoryQuery,
} from "../store/api/orderApi";
import { useCreateArmorTypeMutation, useGetArmorTypesQuery } from "../store/api/armorTypesApi";
import { useCreateCuttingJobMutation } from "../store/api/cuttingApi";
import { usePreviewCuttingJobQuery } from "../store/api/cuttingJobApi";
import { useCreateMaterialMutation, useGetMaterialsQuery } from "../store/api/materialsApi";
import { useCreateDeviceTypeMutation, useGetDeviceTypesQuery } from "../store/api/deviceTypeApi";
import { useGetDiscountsQuery } from "../store/api/discountApi";

const { Option } = Select;

// ── Константы ────────────────────────────────────────────────────────────────
const CARDS_PER_ROW = 6;
const VISIBLE_ROWS = 2;
const PAGE_SIZE = CARDS_PER_ROW * VISIBLE_ROWS; // 12

const STATUS_COLOR = { NEW: "blue", IN_PROGRESS: "orange", DONE: "green", DEFECT: "red", REWORK: "purple" };
const STATUS_LABEL = { NEW: "Новый", IN_PROGRESS: "В работе", DONE: "Выполнен", DEFECT: "Брак", REWORK: "Переделка" };
const RULE_LABEL = { SECOND_WRAPPING: "Вторая оклейка", REFERRAL: "Привёл друга", SECOND_DEVICE: "Второе устройство", MANUAL: "Ручная" };

function calcDiscountedAmount(base, discount) {
	if (!discount || !base) return base ?? 0;
	switch (discount.type) {
		case "PERCENT": 
		case "PERCENTAGE": // Добавлено для обработки "PERCENTAGE"
			return Math.max(0, base - (base * discount.value) / 100);
		case "FIXED": 
			return Math.max(0, base - discount.value); // Исправлено для корректного вычитания
		case "PRICE_OVERRIDE": 
			return discount.value; 
		default: 
			return base;
	}
}



// ── Хук поиска + пагинации ────────────────────────────────────────────────────
function useSearchableCards(data, searchQuery) {
	const [page, setPage] = useState(1);

	const filtered = useMemo(() => {
		if (!searchQuery.trim()) return data;
		const q = searchQuery.toLowerCase();
		return data.filter(
			(item) =>
				item.name?.toLowerCase().includes(q) ||
				item.brand?.toLowerCase().includes(q) ||
				item.type?.toLowerCase().includes(q)
		);
	}, [data, searchQuery]);

	useEffect(() => { setPage(1); }, [searchQuery]);

	const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
	const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	return { paged, filtered, page, setPage, totalPages };
}

// ── CardGrid ──────────────────────────────────────────────────────────────────
function CardGrid({ title, data, selected, onSelect, renderCard, onAddNew }) {
	const [search, setSearch] = useState("");
	const { paged, filtered, page, setPage, totalPages } = useSearchableCards(data, search);

	return (
		<div style={{ marginBottom: 20 }}>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
				<span style={{ fontWeight: 600, fontSize: 13, color: "#333" }}>{title}</span>
				<Space size={6}>
					<span style={{ fontSize: 11, color: "#999" }}>{filtered.length} из {data.length}</span>
					<Button size="small" icon={<PlusOutlined />} onClick={onAddNew} type="dashed">Добавить</Button>
				</Space>
			</div>

			<Input
				size="small"
				prefix={<SearchOutlined style={{ color: "#bbb" }} />}
				placeholder={`Поиск...`}
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				allowClear
				style={{ marginBottom: 8, borderRadius: 6 }}
			/>

			{filtered.length === 0 ? (
				<Empty description="Ничего не найдено" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: "12px 0" }} />
			) : (
				<div style={{
					display: "grid",
					gridTemplateColumns: `repeat(${CARDS_PER_ROW}, 140px)`,
					gridTemplateRows: `repeat(${VISIBLE_ROWS}, 1fr)`,
					gap: 8,
					overflowX: "auto",
					overflowY: "hidden",
					paddingBottom: 4,
				}}>
					{paged.map((item) => renderCard(item, selected, onSelect))}
				</div>
			)}

			{totalPages > 1 && (
				<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
					<Button size="small" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Назад</Button>
					<span style={{ fontSize: 11, color: "#888" }}>
						Страница {page} / {totalPages} ({filtered.length} записей)
					</span>
					<Button size="small" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Вперёд →</Button>
				</div>
			)}
		</div>
	);
}

// ── Карточка устройства ───────────────────────────────────────────────────────
function DeviceCard({ item, selected, onSelect }) {
	const isSelected = selected?.id === item.id;
	return (
		<div
			key={item.id}
			onClick={() => onSelect(isSelected ? null : item)}
			style={{
				cursor: "pointer",
				border: `2px solid ${isSelected ? "#6c5ce7" : "#e8e8e8"}`,
				borderRadius: 10, padding: "8px 6px",
				background: isSelected ? "#f0eeff" : "#fafafa",
				textAlign: "center", transition: "all 0.15s",
				userSelect: "none", position: "relative",
				height: 110, display: "flex", flexDirection: "column",
				alignItems: "center", justifyContent: "center",
			}}
		>
			{isSelected && <CheckCircleOutlined style={{ position: "absolute", top: 4, right: 4, color: "#6c5ce7", fontSize: 12 }} />}
			{item.imageUrl ? (
				<img src={item.imageUrl} alt={item.name}
					style={{ width: 48, height: 48, objectFit: "contain", marginBottom: 4 }}
					onError={(e) => { e.target.style.display = "none"; }} />
			) : (
				<div style={{
					width: 48, height: 48, borderRadius: 8, background: "#e8e3ff",
					display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, fontSize: 20
				}}>📱</div>
			)}
			<div style={{ fontSize: 11, fontWeight: 600, color: "#333", lineHeight: 1.2, wordBreak: "break-word" }}>{item.name}</div>
			{item.brand && <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{item.brand}</div>}
		</div>
	);
}

// ── Карточка материала ────────────────────────────────────────────────────────
function MaterialCard({ item, selected, onSelect }) {
	const isSelected = selected?.id === item.id;
	return (
		<div
			key={item.id}
			onClick={() => onSelect(isSelected ? null : item)}
			style={{
				cursor: "pointer",
				border: `2px solid ${isSelected ? "#00b894" : "#e8e8e8"}`,
				borderRadius: 10, padding: "8px 6px",
				background: isSelected ? "#eafaf6" : "#fafafa",
				textAlign: "center", transition: "all 0.15s",
				userSelect: "none", position: "relative",
				height: 110, display: "flex", flexDirection: "column",
				alignItems: "center", justifyContent: "center",
			}}
		>
			{isSelected && <CheckCircleOutlined style={{ position: "absolute", top: 4, right: 4, color: "#00b894", fontSize: 12 }} />}
			{item.imageUrl ? (
				<img src={item.imageUrl} alt={item.name}
					style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, marginBottom: 4 }}
					onError={(e) => { e.target.style.display = "none"; }} />
			) : (
				<div style={{
					width: 48, height: 48, borderRadius: 6,
					background: "linear-gradient(135deg, #a29bfe, #6c5ce7)",
					display: "flex", alignItems: "center", justifyContent: "center",
					marginBottom: 4, fontSize: 18, color: "#fff"
				}}>🛡</div>
			)}
			<div style={{ fontSize: 11, fontWeight: 600, color: "#333", lineHeight: 1.2, wordBreak: "break-word" }}>{item.name}</div>
			{item.price != null && (
				<div style={{ fontSize: 10, color: "#00b894", marginTop: 2, fontWeight: 600 }}>{item.price} сом</div>
			)}
		</div>
	);
}

// ── Карточка типа резки ───────────────────────────────────────────────────────
function ArmorCard({ item, selected, onSelect }) {
	const isSelected = selected?.id === item.id;
	return (
		<div
			key={item.id}
			onClick={() => onSelect(isSelected ? null : item)}
			style={{
				cursor: "pointer",
				border: `2px solid ${isSelected ? "#fdcb6e" : "#e8e8e8"}`,
				borderRadius: 10, padding: "8px 6px",
				background: isSelected ? "#fffbef" : "#fafafa",
				textAlign: "center", transition: "all 0.15s",
				userSelect: "none", position: "relative",
				height: 110, display: "flex", flexDirection: "column",
				alignItems: "center", justifyContent: "center",
			}}
		>
			{isSelected && <CheckCircleOutlined style={{ position: "absolute", top: 4, right: 4, color: "#fdcb6e", fontSize: 12 }} />}
			<div style={{
				width: 44, height: 44, borderRadius: "50%",
				background: isSelected ? "#fdcb6e" : "#eee",
				display: "flex", alignItems: "center", justifyContent: "center",
				marginBottom: 6, fontSize: 20, transition: "background 0.15s"
			}}>✂️</div>
			<div style={{ fontSize: 11, fontWeight: 600, color: "#333", lineHeight: 1.2, wordBreak: "break-word" }}>{item.name}</div>
			{item.description && (
				<div style={{
					fontSize: 10, color: "#999", marginTop: 2, overflow: "hidden",
					textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120
				}}>{item.description}</div>
			)}
		</div>
	);
}

// ── Основной компонент ────────────────────────────────────────────────────────
export default function CuttingOrdersPage() {

	const { data: materials = [] } = useGetMaterialsQuery();
	const { data: armorTypes = [] } = useGetArmorTypesQuery();
	const { data: deviceTypes = [] } = useGetDeviceTypesQuery();
	const { data: discounts = [] } = useGetDiscountsQuery();

	const [createMaterial] = useCreateMaterialMutation();
	const [createArmorType] = useCreateArmorTypeMutation();
	const [createDeviceType] = useCreateDeviceTypeMutation();

	const { data: cuttingJobs = [], isLoading } = useGetOrdersQuery();
	const [createCuttingJob] = useCreateCuttingJobMutation();
	const [createOrder] = useCreateOrderMutation();
	const [changeOrderStatus] = useChangeOrderStatusMutation();

	// ── Форма ────────────────────────────────────────────────────────────────
	const [selectedMaterial, setSelectedMaterial] = useState(null);
	const [selectedArmor, setSelectedArmor] = useState(null);
	const [selectedDevice, setSelectedDevice] = useState(null);
	const [selectedDiscount, setSelectedDiscount] = useState(null);
	const [quantity, setQuantity] = useState(1);
	const [summa, setSumma] = useState(undefined);
	const [notes, setNotes] = useState("");
	const [clientPhone, setClientPhone] = useState("");
	const [clientName, setClientName] = useState("");
	const [clientEmail, setClientEmail] = useState("");
	const [manualSumma, setManualSumma] = useState(false);
	const [price, setPrice] = useState(0);

	// ── Создание новых типов ─────────────────────────────────────────────────
	const [deviceBrand, setDeviceBrand] = useState("");
	const [materialBarcode, setMaterialBarcode] = useState("");
	const [materialType, setMaterialType] = useState("");
	const [materialThickness, setMaterialThickness] = useState(undefined);
	const [materialPrice, setMaterialPrice] = useState(undefined);
	const [armorDescription, setArmorDescription] = useState("");

	// ── Модалки ──────────────────────────────────────────────────────────────
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isFileModalOpen, setIsFileModalOpen] = useState(false);
	const [isCreateTypeModalOpen, setIsCreateTypeModalOpen] = useState(false);
	const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
	const [defectRecord, setDefectRecord] = useState(null);
	const [fileList, setFileList] = useState([]);
	const [newTypeName, setNewTypeName] = useState("");
	const [currentType, setCurrentType] = useState("");

	// ── Гарантия 365 ─────────────────────────────────────────────────────────
	const [warrantyDrawerOpen, setWarrantyDrawerOpen] = useState(false);
	const [warrantyPhone, setWarrantyPhone] = useState("");
	const [warrantySearch, setWarrantySearch] = useState("");

	const { data: clientHistory, isFetching: historyLoading } = useGetClientHistoryQuery(
		warrantySearch,
		{ skip: !warrantySearch }
	);

	// ── Preview ──────────────────────────────────────────────────────────────
	const { data: cuttingJobPreview } = usePreviewCuttingJobQuery(
		{ materialId: selectedMaterial?.id, cuttingTypeId: selectedArmor?.id, deviceTypeId: selectedDevice?.id },
		{ skip: !selectedMaterial?.id || !selectedArmor?.id || !selectedDevice?.id }
	);

	// ── Авторасчёт суммы ─────────────────────────────────────────────────────
	// Авторасчёт суммы
	useEffect(() => {
		if (manualSumma) return; // Если пользователь ввел сумму вручную, не пересчитываем
		const base = (cuttingJobPreview?.price ?? 0) * quantity; // Базовая сумма
		if (!base) { setSumma(undefined); return; }

		// Вычисляем сумму с учетом скидки
		const discountedSum = calcDiscountedAmount(base, selectedDiscount);
		setSumma(discountedSum); // Устанавливаем итоговую сумму
	}, [cuttingJobPreview, quantity, selectedDiscount, manualSumma]);


	useEffect(() => { setManualSumma(false); },
		[selectedMaterial, selectedArmor, selectedDevice, selectedDiscount]);

	const baseSumma = useMemo(() => {
		if (!cuttingJobPreview?.price) return undefined;
		return cuttingJobPreview.price * quantity;
	}, [cuttingJobPreview, quantity]);

	const discountAmount = useMemo(() => {
		if (!baseSumma || !selectedDiscount) return 0;

		if (selectedDiscount.type === "PRICE_OVERRIDE") {
			return baseSumma - selectedDiscount.value; // Обновлено: вычитаем фиксированную цену из базовой
		}

		return baseSumma - calcDiscountedAmount(baseSumma, selectedDiscount);
	}, [baseSumma, selectedDiscount]);


	// ── Создание новых типов ─────────────────────────────────────────────────
	const openCreateTypeModal = (type) => {
		setCurrentType(type); setNewTypeName(""); setIsCreateTypeModalOpen(true);
	};

	const handleCreateType = async () => {
		try {
			if (currentType === "material") {
				await createMaterial({
					name: newTypeName, barcode: materialBarcode || "",
					type: materialType || undefined, thickness: materialThickness || undefined,
					price: materialPrice || 0, isActive: true,
				}).unwrap();
			} else if (currentType === "armor") {
				await createArmorType({ name: newTypeName, description: armorDescription || undefined, isActive: true }).unwrap();
			} else if (currentType === "device") {
				await createDeviceType({ name: newTypeName, brand: deviceBrand || undefined, isActive: true }).unwrap();
			}
			message.success("Создано успешно!");
			setIsCreateTypeModalOpen(false);
		} catch { message.error("Ошибка при создании"); }
	};

	// ── Payload заказа ───────────────────────────────────────────────────────
	const buildOrderPayload = (cuttingJobId) => ({
		cuttingJobId,
		quantity,
		notes: notes || undefined,
		clientName: clientName || undefined,
		clientPhone,
		clientEmail: clientEmail || undefined,
		materialId: selectedMaterial?.id,   // ✅ ДОБАВЛЕНО — материал
		// Скидка: по rule или по id
		...(selectedDiscount?.rule && selectedDiscount.rule !== "MANUAL"
			? { discountRule: selectedDiscount.rule }
			: selectedDiscount?.id
				? { discountId: selectedDiscount.id }
				: {}),
		// Сумма (если ручная или PRICE_OVERRIDE)
		...(manualSumma || selectedDiscount?.type === "PRICE_OVERRIDE" ? { summa } : {}),
	});


	const handleCreateClick = () => {
		if (!selectedMaterial || !selectedArmor || !selectedDevice || !clientPhone)
			return message.error("Заполните все обязательные поля!");
		cuttingJobPreview?.id ? setIsModalOpen(true) : setIsFileModalOpen(true);
	};

	const handleConfirmOrder = async () => {
		try {
			await createOrder(buildOrderPayload(cuttingJobPreview.id)).unwrap();
			message.success("Резка создана!"); setIsModalOpen(false); resetForm();
		} catch { message.error("Ошибка создания резки"); }
	};

	const handleCreateCuttingJobWithFile = async () => {
		try {
			const fd = new FormData();
			fd.append("materialId", selectedMaterial?.id);
			fd.append("cuttingTypeId", selectedArmor?.id);
			fd.append("deviceTypeId", selectedDevice?.id);
			fd.append("price", price);
			if (fileList.length > 0) fd.append("file", fileList[0].originFileObj);
			const newJob = await createCuttingJob(fd).unwrap();
			message.success("Задание создано!");
			setIsFileModalOpen(false); setFileList([]);
			await createOrder(buildOrderPayload(newJob.id)).unwrap();
			message.success("Резка создана!"); resetForm();
		} catch { message.error("Ошибка"); }
	};

	const handleDefect = async () => {
		if (!defectRecord) return;
		try {
			await changeOrderStatus({ id: defectRecord.id, status: "DEFECT" }).unwrap();
			message.success("Помечено как брак");
			setIsDefectModalOpen(false); setDefectRecord(null);
		} catch { message.error("Ошибка"); }
	};

	const handleRecreate = async (record) => {
		try {
			await createOrder({
				cuttingJobId: record.cuttingJob.id, quantity: 1,
				clientName: record.client?.name, clientPhone: record.client?.phone,
				clientEmail: record.client?.email,
				...(record.discount?.rule && record.discount.rule !== "MANUAL"
					? { discountRule: record.discount.rule }
					: record.discount?.id ? { discountId: record.discount.id } : {}),
				summa: record.finalAmount,
			}).unwrap();
			message.success("Заказ повторно создан!");
		} catch { message.error("Ошибка при повторном создании"); }
	};

	const handleStatusChange = async (id, status) => {
		try {
			await changeOrderStatus({ id, status }).unwrap();
			message.success(`Статус: ${STATUS_LABEL[status] ?? status}`);
		} catch { message.error("Ошибка"); }
	};

	const handleUseWarranty = async () => {
		const warrantyDiscount = discounts.find(d => d.name === "Гарантийная оклейка 365");
		if (warrantyDiscount) {
			setSelectedDiscount(warrantyDiscount);
			message.success("Гарантия 365 дней применена!");
		} else {
			message.error("Гарантия не доступна.");
		}
	};

	// В вашем рендере добавьте кнопку


	const resetForm = () => {
		setSelectedMaterial(null); setSelectedArmor(null);
		setSelectedDevice(null); setSelectedDiscount(null);
		setQuantity(1); setSumma(undefined); setNotes("");
		setClientPhone(""); setClientName(""); setClientEmail("");
		setManualSumma(false); setPrice(0);
	};

	// ── Тег статуса гарантии ─────────────────────────────────────────────────
	// ✅ SafetyCertificateOutlined вместо ShieldOutlined
	const warrantyStatusTag = (order) => {
		if (!order.createdAt) return null;
		const days = Math.floor((Date.now() - new Date(order.createdAt)) / 86400000);
		if (order.warrantyUsed)
			return <Tag color="red" icon={<CloseCircleOutlined />}>Гарантия использована</Tag>;
		if (days > 365)
			return <Tag color="default" icon={<ExclamationCircleOutlined />}>Истекла ({days} дн.)</Tag>;
		return (
			<Tag color="green" icon={<SafetyCertificateOutlined />}>
				Активна ({365 - days} дн. осталось)
			</Tag>
		);
	};

	// ── Колонки таблицы ──────────────────────────────────────────────────────
	const columns = [
		{ title: "Телефон", dataIndex: ["client", "phone"], key: "phone" },
		{ title: "Устройство", dataIndex: ["cuttingJob", "deviceType", "name"], key: "device" },
		{ title: "Материал", dataIndex: ["cuttingJob", "material", "name"], key: "material" },
		{ title: "Тип резки", dataIndex: ["cuttingJob", "armorType", "name"], key: "armor" },
		{ title: "Кол-во", dataIndex: "quantity", width: 60 },
		{
			title: "Сумма", key: "amount",
			render: (_, r) => (
				<Space direction="vertical" size={0}>
					{r.discount && <span style={{ textDecoration: "line-through", color: "#999", fontSize: 11 }}>{r.totalAmount} сом</span>}
					<strong>{r.finalAmount} сом</strong>
				</Space>
			),
		},
		{
			title: "Скидка", key: "discount",
			render: (_, r) => r.discount
				? <Tooltip title={r.discount.description}><Tag color="volcano" icon={<TagOutlined />}>{RULE_LABEL[r.discount.rule] ?? r.discount.name}</Tag></Tooltip>
				: "—",
		},
		{
			title: "Статус", key: "status",
			render: (_, r) => <Tag color={STATUS_COLOR[r.status] ?? "default"}>{STATUS_LABEL[r.status] ?? r.status}</Tag>,
		},
		{
			title: "Действия", key: "actions",
			render: (_, r) => (
				<Space>
					{r.status !== "DONE" && r.status !== "DEFECT" && (
						<>
							<Button type="primary" size="small" onClick={() => handleStatusChange(r.id, "DONE")}>Провести</Button>
							<Button danger size="small" onClick={() => { setDefectRecord(r); setIsDefectModalOpen(true); }}>Брак</Button>
						</>
					)}
					{r.status === "DEFECT" && (
						<Button type="dashed" size="small" icon={<ReloadOutlined />} onClick={() => handleRecreate(r)}>Повторить</Button>
					)}
				</Space>
			),
		},
	];

	// ── Рендер ───────────────────────────────────────────────────────────────
	return (
		<div style={{ padding: "16px 20px" }}>

			{/* Заголовок */}
			<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
				<h2 style={{ margin: 0 }}>✂️ Создать резку</h2>
				{/* ✅ SafetyCertificateOutlined вместо ShieldOutlined */}
				<Button
					icon={<SafetyCertificateOutlined />}
					style={{ background: "#6c5ce7", color: "#fff", border: "none", borderRadius: 8 }}
					onClick={() => setWarrantyDrawerOpen(true)}
				>
					Гарантия 365 дней
				</Button>
			</div>

			{/* Карточки устройств */}
			<CardGrid
				title="📱 Устройство *"
				data={deviceTypes.filter((d) => d.isActive !== false)}
				selected={selectedDevice}
				onSelect={setSelectedDevice}
				onAddNew={() => openCreateTypeModal("device")}
				renderCard={(item, sel, onSel) => <DeviceCard key={item.id} item={item} selected={sel} onSelect={onSel} />}
			/>

			{/* Карточки материалов */}
			<CardGrid
				title="🛡 Материал *"
				data={materials.filter((m) => m.isActive !== false)}
				selected={selectedMaterial}
				onSelect={setSelectedMaterial}
				onAddNew={() => openCreateTypeModal("material")}
				renderCard={(item, sel, onSel) => <MaterialCard key={item.id} item={item} selected={sel} onSelect={onSel} />}
			/>

			{/* Карточки типов резки */}
			<CardGrid
				title="✂️ Тип резки *"
				data={armorTypes.filter((a) => a.isActive !== false)}
				selected={selectedArmor}
				onSelect={setSelectedArmor}
				onAddNew={() => openCreateTypeModal("armor")}
				renderCard={(item, sel, onSel) => <ArmorCard key={item.id} item={item} selected={sel} onSelect={onSel} />}
			/>

			<Divider style={{ margin: "12px 0" }} />

			{/* Скидка + Кол-во + Сумма */}
			<Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
				<Col xs={24} sm={12} md={6}>
					<Select
						showSearch allowClear
						placeholder="Скидка (опционально)"
						style={{ width: "100%" }}
						value={selectedDiscount?.id ?? null}
						optionFilterProp="children"
						onChange={(id) => {
							setSelectedDiscount(id ? discounts.find((d) => d.id === id) ?? null : null);
							setManualSumma(false);
						}}
					>
						{discounts.filter((d) => d.isActive).map((d) => (
							<Option key={d.id} value={d.id}>
								<Space>
									<TagOutlined />
									{RULE_LABEL[d.rule] ?? d.name}
									<span style={{ color: "#999", fontSize: 12 }}>
										{d.type === "PERCENT" ? `−${d.value}%` : d.type === "PRICE_OVERRIDE" ? `= ${d.value} сом` : `−${d.value} сом`}
									</span>
								</Space>
							</Option>
						))}
					</Select>
				</Col>
				<Col xs={12} sm={6} md={3}>
					<InputNumber min={1} value={quantity} onChange={(v) => setQuantity(v ?? 1)}
						placeholder="Кол-во" style={{ width: "100%" }} />
				</Col>
				<Col xs={12} sm={6} md={4}>
					<InputNumber
						value={summa}
						onChange={(v) => { setSumma(v); setManualSumma(true); }}
						placeholder="Итого (сом)"
						style={{ width: "100%" }}
						addonAfter={
							selectedDiscount && discountAmount > 0
								? <Tooltip title={`Скидка: −${Math.round(discountAmount)} сом`}><PercentageOutlined style={{ color: "#f5222d" }} /></Tooltip>
								: null
						}
					/>
					{selectedDiscount && discountAmount > 0 && (
						<div style={{ fontSize: 11, color: "#f5222d", marginTop: 2 }}>
							−{Math.round(discountAmount)} сом (было {baseSumma} сом)
						</div>
					)}
				</Col>
				<Col xs={24} sm={6} md={3}>
					<Button type="primary" onClick={handleCreateClick} block style={{ background: "#6c5ce7", border: "none" }}>
						Начать резку
					</Button>
				</Col>
			</Row>

			{/* Клиент */}
			<Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
				<Col xs={24} sm={12} md={6}>
					<Input placeholder="Телефон клиента *" value={clientPhone}
						onChange={(e) => setClientPhone(e.target.value)} />
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Input placeholder="Имя клиента (опционально)" value={clientName}
						onChange={(e) => setClientName(e.target.value)} />
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Input placeholder="Email (опционально)" value={clientEmail}
						onChange={(e) => setClientEmail(e.target.value)} />
				</Col>
				<Col xs={24} md={12}>
					<Input.TextArea placeholder="Заметки..." value={notes}
						onChange={(e) => setNotes(e.target.value)} autoSize={{ minRows: 1, maxRows: 3 }} />
				</Col>
			</Row>

			{/* Выбранные параметры */}
			{(selectedDevice || selectedMaterial || selectedArmor) && (
				<Alert
					type="info"
					style={{ marginBottom: 12, borderRadius: 8 }}
					message={
						<Space wrap>
							{selectedDevice && <Tag color="purple">📱 {selectedDevice.name}</Tag>}
							{selectedMaterial && <Tag color="green">🛡 {selectedMaterial.name}</Tag>}
							{selectedArmor && <Tag color="gold">✂️ {selectedArmor.name}</Tag>}
							{summa != null && <Tag color="blue">💰 {summa} сом</Tag>}
						</Space>
					}
				/>
			)}

			{/* Таблица заказов */}
			<Divider orientation="left">Заказы</Divider>
			<Table
				dataSource={cuttingJobs}
				columns={columns}
				rowKey="id"
				size="small"
				loading={isLoading}
				bordered
				scroll={{ x: true }}
				pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Всего: ${t}` }}
			/>

			{/* Модалка: подтверждение */}
			<Modal title="Подтвердите создание резки" open={isModalOpen}
				onOk={handleConfirmOrder} onCancel={() => setIsModalOpen(false)}
				okText="Создать" cancelText="Отмена">
				<Space direction="vertical" style={{ width: "100%" }}>
					<Tag color="purple">📱 {selectedDevice?.name}</Tag>
					<Tag color="green">🛡 {selectedMaterial?.name}</Tag>
					<Tag color="gold">✂️ {selectedArmor?.name}</Tag>
					<p>Количество: <strong>{quantity}</strong></p>
					<p>Сумма: {selectedDiscount && discountAmount > 0 ? (
	<>
		{selectedDiscount.type === "PRICE_OVERRIDE" ? (
			<>
				<strong style={{ color: "#f5222d" }}>{selectedDiscount.value} сом</strong>
				<Tag color="volcano" style={{ marginLeft: 4 }}>{RULE_LABEL[selectedDiscount.rule] ?? selectedDiscount.name}</Tag>
			</>
		) : (
			<>
				<span style={{ textDecoration: "line-through", color: "#999" }}>{baseSumma} сом</span>{" "}
				<strong style={{ color: "#f5222d" }}>{summa} сом</strong>
				<Tag color="volcano" style={{ marginLeft: 4 }}>{RULE_LABEL[selectedDiscount.rule] ?? selectedDiscount.name}</Tag>
			</>
		)}
	</>
) : <strong>{summa} сом</strong>}</p>


					<p>Телефон: {clientPhone}</p>
					{clientName && <p>Имя: {clientName}</p>}
				</Space>
			</Modal>

			{/* Модалка: новый job с файлом */}
			<Modal title="Создать задание на резку" open={isFileModalOpen}
				onOk={handleCreateCuttingJobWithFile}
				onCancel={() => { setIsFileModalOpen(false); setFileList([]); }}
				okText="Создать и резать" cancelText="Отмена">
				<Row gutter={[16, 16]}>
					<Col xs={24}>
						<Upload beforeUpload={() => false} maxCount={1} fileList={fileList}
							onChange={({ fileList: fl }) => setFileList(fl)}>
							<Button icon={<UploadOutlined />}>Файл (опционально)</Button>
						</Upload>
					</Col>
					<Col xs={24} sm={12}>
						<InputNumber min={0} style={{ width: "100%" }} placeholder="Цена за единицу"
							value={price} onChange={setPrice} />
					</Col>
					{selectedDiscount && (
						<Col xs={24}>
							<Tag color="volcano" icon={<TagOutlined />}>
								{RULE_LABEL[selectedDiscount.rule] ?? selectedDiscount.name}:{" "}
								{selectedDiscount.type === "PERCENT" ? `−${selectedDiscount.value}%`
									: selectedDiscount.type === "PRICE_OVERRIDE" ? `= ${selectedDiscount.value} сом`
										: `−${selectedDiscount.value} сом`}
							</Tag>
						</Col>
					)}
				</Row>
			</Modal>

			{/* Модалка: брак */}
			<Modal
				title={<span style={{ color: "#f5222d" }}>⚠️ Пометить как брак</span>}
				open={isDefectModalOpen}
				onOk={handleDefect}
				onCancel={() => { setIsDefectModalOpen(false); setDefectRecord(null); }}
				okText="Подтвердить брак" okButtonProps={{ danger: true }}
				cancelText="Отмена"
			>
				{defectRecord && (
					<Space direction="vertical">
						<p>Вы уверены, что хотите пометить этот заказ как <strong>брак</strong>?</p>
						<Tag color="purple">📱 {defectRecord.cuttingJob?.deviceType?.name}</Tag>
						<Tag color="green">🛡 {defectRecord.cuttingJob?.material?.name}</Tag>
						<p>Клиент: {defectRecord.client?.phone}</p>
						<p>Сумма: {defectRecord.finalAmount} сом</p>
						<p style={{ color: "#888", fontSize: 12 }}>После этого можно нажать «Повторить» для перерезки.</p>
					</Space>
				)}
			</Modal>

			{/* Модалка: создание нового типа */}
			<Modal title={`Создать новый: ${currentType}`} open={isCreateTypeModalOpen}
				onOk={handleCreateType} onCancel={() => setIsCreateTypeModalOpen(false)}
				okText="Создать" cancelText="Отмена">
				<Input placeholder="Название *" value={newTypeName}
					onChange={(e) => setNewTypeName(e.target.value)} style={{ marginBottom: 12 }} />
				{currentType === "device" && (
					<Input placeholder="Бренд (опционально)" value={deviceBrand}
						onChange={(e) => setDeviceBrand(e.target.value)} />
				)}
				{currentType === "material" && (
					<Space direction="vertical" style={{ width: "100%" }}>
						<Input placeholder="Штрихкод" value={materialBarcode} onChange={(e) => setMaterialBarcode(e.target.value)} />
						<Input placeholder="Тип" value={materialType} onChange={(e) => setMaterialType(e.target.value)} />
						<InputNumber placeholder="Толщина" value={materialThickness} onChange={setMaterialThickness} style={{ width: "100%" }} />
						<InputNumber placeholder="Цена" value={materialPrice} onChange={setMaterialPrice} style={{ width: "100%" }} />
					</Space>
				)}
				{currentType === "armor" && (
					<Input placeholder="Описание" value={armorDescription}
						onChange={(e) => setArmorDescription(e.target.value)} />
				)}
			</Modal>

			<Drawer
				title={
					<Space>
						<SafetyCertificateOutlined style={{ color: "#6c5ce7" }} />
						<span>Гарантия 365 дней</span>
					</Space>
				}
				placement="right"
				width={480}
				open={warrantyDrawerOpen}
				onClose={() => {
					setWarrantyDrawerOpen(false);
					setWarrantyPhone("");
					setWarrantySearch("");
				}}
			>
				<Space direction="vertical" style={{ width: "100%" }} size={12}>
					<p style={{ color: "#666", margin: 0 }}>
						Введите телефон клиента, чтобы проверить историю оклеек и статус гарантии.
					</p>
					<Input.Search
						placeholder="Номер телефона"
						value={warrantyPhone}
						onChange={(e) => setWarrantyPhone(e.target.value)}
						onSearch={(v) => setWarrantySearch(v)}
						enterButton="Найти"
						size="large"
						loading={historyLoading}
					/>

					{historyLoading && <Spin tip="Загружаем историю..." />}

					{!historyLoading && warrantySearch && !clientHistory && (
						<Empty description="Клиент не найден или заказов нет" />
					)}

					{Array.isArray(clientHistory) && clientHistory.length > 0 && (() => {
						// ✅ Проверяем: использовал ли клиент гарантию
						const hasUsedWarranty = clientHistory.some(o => o.isWarrantyOrder);

						return (
							<>
								<div style={{
									background: "#f0eeff", borderRadius: 10,
									padding: "12px 16px", border: "1px solid #d9d0ff"
								}}>
									<div style={{ fontWeight: 700, fontSize: 15 }}>
										История клиента
									</div>
									<div style={{ marginTop: 6 }}>
										<Tag color="purple">Заказов: {clientHistory.length}</Tag>
										{hasUsedWarranty
											? <Tag color="red" icon={<CloseCircleOutlined />}>Гарантия использована</Tag>
											: <Tag color="green" icon={<SafetyCertificateOutlined />}>Гарантия доступна</Tag>
										}
									</div>
								</div>

								<Divider orientation="left">История оклеек</Divider>

								<div style={{ maxHeight: 400, overflowY: "auto" }}>
									<Timeline
										items={clientHistory.map((order) => {
											const daysSince = Math.floor(
												(Date.now() - new Date(order.createdAt)) / 86400000
											);
											const isWithin14Days = daysSince <= 14;
											const isWithin365Days = daysSince <= 365;
											// ✅ Гарантию можно использовать только 1 раз
											const canUseWarranty = !hasUsedWarranty && isWithin365Days;
											// ✅ Брак можно поставить только в течение 14 дней после оклейки
											const canMarkDefect = isWithin14Days && order.status !== "DEFECT";

											return {
												color: order.isWarrantyOrder
													? "purple"
													: STATUS_COLOR[order.status] ?? "blue",
												children: (
													<div style={{
														background: "#fafafa", borderRadius: 8,
														padding: "8px 12px", border: "1px solid #eee", marginBottom: 4
													}}>
														{/* Заголовок */}
														<div style={{
															display: "flex", justifyContent: "space-between", alignItems: "center"
														}}>
															<strong style={{ fontSize: 13 }}>{order.deviceType ?? "—"}</strong>
															<span style={{ fontSize: 11, color: "#999" }}>
																{order.createdAt
																	? new Date(order.createdAt).toLocaleDateString("ru-RU")
																	: "—"}
															</span>
														</div>

														{/* Детали */}
														<div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
															Материал: {order.material ?? "—"} &nbsp;|&nbsp;
															Тип: {order.armorType ?? "—"}
														</div>
														<div style={{ fontSize: 12, color: "#666" }}>
															Сумма: <strong>{order.finalAmount} сом</strong>
															{order.isWarrantyOrder && (
																<Tag color="purple" style={{ marginLeft: 6 }}>
																	Гарантийная оклейка
																</Tag>
															)}
														</div>

														{/* Статус */}
														<div style={{ marginTop: 4 }}>
															{warrantyStatusTag(order)}
															<Tag
																color={STATUS_COLOR[order.status] ?? "default"}
																style={{ marginLeft: 4 }}
															>
																{STATUS_LABEL[order.status] ?? order.status}
															</Tag>
															{isWithin14Days && !order.isWarrantyOrder && (
																<Tag color="orange" style={{ marginLeft: 4 }}>
																	⚠️ В периоде брака (14 дн.)
																</Tag>
															)}
														</div>

														{/* Кнопки */}
														<Space style={{ marginTop: 8 }} wrap>
															{/* ✅ Гарантия — только 1 раз, в течение 365 дней */}
															{canUseWarranty && (
																<Button
																	size="small"
																	style={{
																		background: "#6c5ce7", color: "#fff", border: "none"
																	}}
																	icon={<SafetyCertificateOutlined />}
																	onClick={async () => {
																		try {
																			await changeOrderStatus({
																				id: order.id, status: "REWORK"
																			}).unwrap();
																			message.success(
																				"Гарантия применена! Заказ отправлен на переделку."
																			);
																			// Сбрасываем поиск чтобы обновить данные
																			setWarrantySearch("");
																			setTimeout(() => setWarrantySearch(warrantyPhone), 300);
																		} catch {
																			message.error("Ошибка применения гарантии");
																		}
																	}}
																>
																	Использовать гарантию
																</Button>
															)}

															{/* ✅ Брак — только в течение 14 дней */}
															{canMarkDefect && (
																<Button
																	danger
																	size="small"
																	onClick={async () => {
																		try {
																			await changeOrderStatus({
																				id: order.id, status: "DEFECT"
																			}).unwrap();
																			message.success("Заказ помечен как брак");
																			setWarrantySearch("");
																			setTimeout(() => setWarrantySearch(warrantyPhone), 300);
																		} catch {
																			message.error("Ошибка");
																		}
																	}}
																>
																	Брак (в течение 14 дн.)
																</Button>
															)}

															{/* ✅ Гарантия недоступна — информация */}
															{hasUsedWarranty && !order.isWarrantyOrder && isWithin365Days && (
																<Tag color="default" icon={<ExclamationCircleOutlined />}>
																	Гарантия уже использована
																</Tag>
															)}
														</Space>
													</div>
												),
											};
										})}
									/>
								</div>
							</>
						);
					})()}
				</Space>
			</Drawer>
		</div>
	);
}