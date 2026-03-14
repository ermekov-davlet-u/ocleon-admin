// pages/CuttingOrdersPage.jsx
import { useEffect, useState, useMemo } from "react";
import {
	Button,
	InputNumber,
	Select,
	Modal,
	message,
	Input,
	Row,
	Col,
	Space,
	Upload,
	Tag,
	Tooltip,
	Drawer,
	Timeline,
	Spin,
	Empty,
	Divider,
	Alert,
	Table,
} from "antd";
import {
	UploadOutlined,
	PlusOutlined,
	PercentageOutlined,
	TagOutlined,
	SearchOutlined,
	SafetyCertificateOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	ExclamationCircleOutlined,
} from "@ant-design/icons";

import {
	useGetOrdersQuery,
	useCreateOrderMutation,
	useChangeOrderStatusMutation,
	useGetClientHistoryQuery,
	useUseWarrantyMutation,
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

const STATUS_COLOR = {
	NEW: "blue",
	IN_PROGRESS: "orange",
	DONE: "green",
	DEFECT: "red",
	REWORK: "purple",
};

const STATUS_LABEL = {
	NEW: "Новый",
	IN_PROGRESS: "В работе",
	DONE: "Выполнен",
	DEFECT: "Брак",
	REWORK: "Переделка",
};

const RULE_LABEL = {
	SECOND_WRAPPING: "Вторая оклейка",
	REFERRAL: "Привёл друга",
	SECOND_DEVICE: "Второе устройство",
	MANUAL: "Ручная",
};

function useIsMobile(breakpoint = 768) {
	const [isMobile, setIsMobile] = useState(() =>
		typeof window !== "undefined" ? window.innerWidth < breakpoint : false
	);

	useEffect(() => {
		const onResize = () => setIsMobile(window.innerWidth < breakpoint);
		window.addEventListener("resize", onResize);
		return () => window.removeEventListener("resize", onResize);
	}, [breakpoint]);

	return isMobile;
}

function calcDiscountedAmount(base, discount) {
	if (!discount || !base) return base ?? 0;

	switch (discount.type) {
		case "PERCENT":
		case "PERCENTAGE":
			return Math.max(0, base - (base * discount.value) / 100);
		case "FIXED":
			return Math.max(0, base - discount.value);
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

	useEffect(() => {
		setPage(1);
	}, [searchQuery]);

	const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
	const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

	return { paged, filtered, page, setPage, totalPages };
}

// ── CardGrid ──────────────────────────────────────────────────────────────────
function CardGrid({ title, data, selected, onSelect, renderCard, onAddNew, isMobile }) {
	const [search, setSearch] = useState("");
	const { paged, filtered, page, setPage, totalPages } = useSearchableCards(data, search);

	const columns = isMobile ? 2 : 6;

	return (
		<div style={{ marginBottom: isMobile ? 16 : 20 }}>
			<div
				style={{
					display: "flex",
					alignItems: isMobile ? "stretch" : "center",
					justifyContent: "space-between",
					marginBottom: 10,
					gap: 8,
					flexDirection: isMobile ? "column" : "row",
				}}
			>
				<span style={{ fontWeight: 700, fontSize: isMobile ? 15 : 13, color: "#333" }}>
					{title}
				</span>

				<Space size={6} wrap>
					<span style={{ fontSize: 12, color: "#999" }}>
						{filtered.length} из {data.length}
					</span>
					<Button
						size={isMobile ? "middle" : "small"}
						icon={<PlusOutlined />}
						onClick={onAddNew}
						type="dashed"
						block={isMobile}
					>
						Добавить
					</Button>
				</Space>
			</div>

			<Input
				size="large"
				prefix={<SearchOutlined style={{ color: "#999", fontSize: 16 }} />}
				placeholder="Поиск..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				allowClear
				style={{
					marginBottom: 10,
					borderRadius: 10,
					height: 44,
				}}
			/>

			{filtered.length === 0 ? (
				<Empty
					description="Ничего не найдено"
					image={Empty.PRESENTED_IMAGE_SIMPLE}
					style={{ padding: "12px 0" }}
				/>
			) : (
				<div
					style={{
						display: "grid",
						gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
						gap: isMobile ? 10 : 8,
						paddingBottom: 4,
					}}
				>
					{paged.map((item) => renderCard(item, selected, onSelect, isMobile))}
				</div>
			)}

			{totalPages > 1 && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginTop: 10,
						gap: 8,
						flexWrap: "wrap",
					}}
				>
					<Button
						size={isMobile ? "middle" : "small"}
						disabled={page === 1}
						onClick={() => setPage((p) => p - 1)}
					>
						← Назад
					</Button>

					<span style={{ fontSize: 12, color: "#888" }}>
						Страница {page} / {totalPages}
					</span>

					<Button
						size={isMobile ? "middle" : "small"}
						disabled={page === totalPages}
						onClick={() => setPage((p) => p + 1)}
					>
						Вперёд →
					</Button>
				</div>
			)}
		</div>
	);
}

// ── Карточка устройства ───────────────────────────────────────────────────────
function DeviceCard({ item, selected, onSelect, isMobile }) {
	const isSelected = selected?.id === item.id;

	return (
		<div
			key={item.id}
			onClick={() => onSelect(isSelected ? null : item)}
			style={{
				cursor: "pointer",
				border: `2px solid ${isSelected ? "#6c5ce7" : "#e8e8e8"}`,
				borderRadius: 12,
				padding: isMobile ? "10px 8px" : "8px 6px",
				background: isSelected ? "#f0eeff" : "#fafafa",
				textAlign: "center",
				transition: "all 0.15s",
				userSelect: "none",
				position: "relative",
				minHeight: isMobile ? 120 : 110,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{isSelected && (
				<CheckCircleOutlined
					style={{ position: "absolute", top: 6, right: 6, color: "#6c5ce7", fontSize: 14 }}
				/>
			)}

			{item.imageUrl ? (
				<img
					src={item.imageUrl}
					alt={item.name}
					style={{
						width: isMobile ? 56 : 48,
						height: isMobile ? 56 : 48,
						objectFit: "contain",
						marginBottom: 6,
					}}
					onError={(e) => {
						e.target.style.display = "none";
					}}
				/>
			) : (
				<div
					style={{
						width: isMobile ? 56 : 48,
						height: isMobile ? 56 : 48,
						borderRadius: 10,
						background: "#e8e3ff",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						marginBottom: 6,
						fontSize: isMobile ? 22 : 20,
					}}
				>
					📱
				</div>
			)}

			<div
				style={{
					fontSize: isMobile ? 12 : 11,
					fontWeight: 600,
					color: "#333",
					lineHeight: 1.25,
					wordBreak: "break-word",
				}}
			>
				{item.name}
			</div>

			{item.brand && (
				<div style={{ fontSize: isMobile ? 11 : 10, color: "#888", marginTop: 3 }}>
					{item.brand}
				</div>
			)}
		</div>
	);
}

// ── Карточка материала ────────────────────────────────────────────────────────
function MaterialCard({ item, selected, onSelect, isMobile }) {
	const isSelected = selected?.id === item.id;

	return (
		<div
			key={item.id}
			onClick={() => onSelect(isSelected ? null : item)}
			style={{
				cursor: "pointer",
				border: `2px solid ${isSelected ? "#00b894" : "#e8e8e8"}`,
				borderRadius: 12,
				padding: isMobile ? "10px 8px" : "8px 6px",
				background: isSelected ? "#eafaf6" : "#fafafa",
				textAlign: "center",
				transition: "all 0.15s",
				userSelect: "none",
				position: "relative",
				minHeight: isMobile ? 120 : 110,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{isSelected && (
				<CheckCircleOutlined
					style={{ position: "absolute", top: 6, right: 6, color: "#00b894", fontSize: 14 }}
				/>
			)}

			{item.imageUrl ? (
				<img
					src={item.imageUrl}
					alt={item.name}
					style={{
						width: isMobile ? 56 : 48,
						height: isMobile ? 56 : 48,
						objectFit: "cover",
						borderRadius: 8,
						marginBottom: 6,
					}}
					onError={(e) => {
						e.target.style.display = "none";
					}}
				/>
			) : (
				<div
					style={{
						width: isMobile ? 56 : 48,
						height: isMobile ? 56 : 48,
						borderRadius: 8,
						background: "linear-gradient(135deg, #a29bfe, #6c5ce7)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						marginBottom: 6,
						fontSize: isMobile ? 20 : 18,
						color: "#fff",
					}}
				>
					🛡
				</div>
			)}

			<div
				style={{
					fontSize: isMobile ? 12 : 11,
					fontWeight: 600,
					color: "#333",
					lineHeight: 1.25,
					wordBreak: "break-word",
				}}
			>
				{item.name}
			</div>

			{item.price != null && (
				<div
					style={{
						fontSize: isMobile ? 11 : 10,
						color: "#00b894",
						marginTop: 3,
						fontWeight: 700,
					}}
				>
					{item.price} сом
				</div>
			)}
		</div>
	);
}

// ── Карточка типа резки ───────────────────────────────────────────────────────
function ArmorCard({ item, selected, onSelect, isMobile }) {
	const isSelected = selected?.id === item.id;

	return (
		<div
			key={item.id}
			onClick={() => onSelect(isSelected ? null : item)}
			style={{
				cursor: "pointer",
				border: `2px solid ${isSelected ? "#fdcb6e" : "#e8e8e8"}`,
				borderRadius: 12,
				padding: isMobile ? "10px 8px" : "8px 6px",
				background: isSelected ? "#fffbef" : "#fafafa",
				textAlign: "center",
				transition: "all 0.15s",
				userSelect: "none",
				position: "relative",
				minHeight: isMobile ? 120 : 110,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{isSelected && (
				<CheckCircleOutlined
					style={{ position: "absolute", top: 6, right: 6, color: "#fdcb6e", fontSize: 14 }}
				/>
			)}

			<div
				style={{
					width: isMobile ? 52 : 44,
					height: isMobile ? 52 : 44,
					borderRadius: "50%",
					background: isSelected ? "#fdcb6e" : "#eee",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: 6,
					fontSize: isMobile ? 22 : 20,
					transition: "background 0.15s",
				}}
			>
				✂️
			</div>

			<div
				style={{
					fontSize: isMobile ? 12 : 11,
					fontWeight: 600,
					color: "#333",
					lineHeight: 1.25,
					wordBreak: "break-word",
				}}
			>
				{item.name}
			</div>

			{item.description && (
				<div
					style={{
						fontSize: isMobile ? 11 : 10,
						color: "#999",
						marginTop: 3,
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
						maxWidth: "100%",
					}}
				>
					{item.description}
				</div>
			)}
		</div>
	);
}

// ── Основной компонент ────────────────────────────────────────────────────────
export default function CuttingOrdersPage() {
	const isMobile = useIsMobile();

	const { data: materials = [] } = useGetMaterialsQuery();
	const { data: armorTypes = [] } = useGetArmorTypesQuery();
	const { data: deviceTypes = [] } = useGetDeviceTypesQuery();
	const { data: discounts = [] } = useGetDiscountsQuery();

	const [createMaterial] = useCreateMaterialMutation();
	const [createArmorType] = useCreateArmorTypeMutation();
	const [createDeviceType] = useCreateDeviceTypeMutation();
	const [nuseWarranty] = useUseWarrantyMutation();
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
		{
			materialId: selectedMaterial?.id,
			cuttingTypeId: selectedArmor?.id,
			deviceTypeId: selectedDevice?.id,
		},
		{ skip: !selectedMaterial?.id || !selectedArmor?.id || !selectedDevice?.id }
	);

	// ── Авторасчёт суммы ─────────────────────────────────────────────────────
	useEffect(() => {
		if (manualSumma) return;
		const base = (cuttingJobPreview?.price ?? 0) * quantity;
		if (!base) {
			setSumma(undefined);
			return;
		}
		const discountedSum = calcDiscountedAmount(base, selectedDiscount);
		setSumma(discountedSum);
	}, [cuttingJobPreview, quantity, selectedDiscount, manualSumma]);

	useEffect(() => {
		setManualSumma(false);
	}, [selectedMaterial, selectedArmor, selectedDevice, selectedDiscount]);

	const baseSumma = useMemo(() => {
		if (!cuttingJobPreview?.price) return undefined;
		return cuttingJobPreview.price * quantity;
	}, [cuttingJobPreview, quantity]);

	const discountAmount = useMemo(() => {
		if (!baseSumma || !selectedDiscount) return 0;

		if (selectedDiscount.type === "PRICE_OVERRIDE") {
			return baseSumma - selectedDiscount.value;
		}

		return baseSumma - calcDiscountedAmount(baseSumma, selectedDiscount);
	}, [baseSumma, selectedDiscount]);

	// ── Создание новых типов ─────────────────────────────────────────────────
	const openCreateTypeModal = (type) => {
		setCurrentType(type);
		setNewTypeName("");
		setDeviceBrand("");
		setMaterialBarcode("");
		setMaterialType("");
		setMaterialThickness(undefined);
		setMaterialPrice(undefined);
		setArmorDescription("");
		setIsCreateTypeModalOpen(true);
	};

	const handleCreateType = async () => {
		try {
			if (!newTypeName?.trim()) {
				message.error("Введите название");
				return;
			}

			if (currentType === "material") {
				await createMaterial({
					name: newTypeName,
					barcode: materialBarcode || "",
					type: materialType || undefined,
					thickness: materialThickness || undefined,
					price: materialPrice || 0,
					isActive: true,
				}).unwrap();
			} else if (currentType === "armor") {
				await createArmorType({
					name: newTypeName,
					description: armorDescription || undefined,
					isActive: true,
				}).unwrap();
			} else if (currentType === "device") {
				await createDeviceType({
					name: newTypeName,
					brand: deviceBrand || undefined,
					isActive: true,
				}).unwrap();
			}

			message.success("Создано успешно!");
			setIsCreateTypeModalOpen(false);
		} catch {
			message.error("Ошибка при создании");
		}
	};

	// ── Payload заказа ───────────────────────────────────────────────────────
	const buildOrderPayload = (cuttingJobId) => ({
		cuttingJobId,
		quantity,
		notes: notes || undefined,
		clientName: clientName || undefined,
		clientPhone,
		clientEmail: clientEmail || undefined,
		materialId: selectedMaterial?.id,
		...(selectedDiscount?.rule && selectedDiscount.rule !== "MANUAL"
			? { discountRule: selectedDiscount.rule }
			: selectedDiscount?.id
				? { discountId: selectedDiscount.id }
				: {}),
		...(manualSumma || selectedDiscount?.type === "PRICE_OVERRIDE" ? { summa } : {}),
	});

	const handleCreateClick = () => {
		if (!selectedMaterial || !selectedArmor || !selectedDevice || !clientPhone) {
			return message.error("Заполните все обязательные поля!");
		}
		cuttingJobPreview?.id ? setIsModalOpen(true) : setIsFileModalOpen(true);
	};

	const handleConfirmOrder = async () => {
		try {
			await createOrder(buildOrderPayload(cuttingJobPreview.id)).unwrap();
			message.success("Резка создана!");
			setIsModalOpen(false);
			resetForm();
		} catch {
			message.error("Ошибка создания резки");
		}
	};

	const handleCreateCuttingJobWithFile = async () => {
		try {
			const fd = new FormData();
			fd.append("materialId", selectedMaterial?.id);
			fd.append("cuttingTypeId", selectedArmor?.id);
			fd.append("deviceTypeId", selectedDevice?.id);
			fd.append("price", price);

			if (fileList.length > 0) {
				fd.append("file", fileList[0].originFileObj);
			}

			const newJob = await createCuttingJob(fd).unwrap();
			message.success("Задание создано!");

			setIsFileModalOpen(false);
			setFileList([]);

			await createOrder(buildOrderPayload(newJob.id)).unwrap();
			message.success("Резка создана!");
			resetForm();
		} catch {
			message.error("Ошибка");
		}
	};

	const handleDefect = async () => {
		if (!defectRecord) return;

		try {
			await changeOrderStatus({ id: defectRecord.id, status: "DEFECT" }).unwrap();
			message.success("Помечено как брак");
			setIsDefectModalOpen(false);
			setDefectRecord(null);
		} catch {
			message.error("Ошибка");
		}
	};

	const handleStatusChange = async (id, status) => {
		try {
			await changeOrderStatus({ id, status }).unwrap();
			message.success(`Статус: ${STATUS_LABEL[status] ?? status}`);
		} catch {
			message.error("Ошибка");
		}
	};

	const resetForm = () => {
		setSelectedMaterial(null);
		setSelectedArmor(null);
		setSelectedDevice(null);
		setSelectedDiscount(null);
		setQuantity(1);
		setSumma(undefined);
		setNotes("");
		setClientPhone("");
		setClientName("");
		setClientEmail("");
		setManualSumma(false);
		setPrice(0);
	};

	const handleRepeatFromDefect = async () => {
		if (!defectRecord) return;

		try {
			await changeOrderStatus({ id: defectRecord.id, status: "DEFECT" }).unwrap();

			const payload = {
				cuttingJobId: defectRecord.cuttingJob?.id,
				quantity: defectRecord.quantity ?? 1,
				notes: defectRecord.notes || "Повторная оклейка после брака",
				clientName: defectRecord.client?.name || undefined,
				clientPhone: defectRecord.client?.phone || "",
				clientEmail: defectRecord.client?.email || undefined,
				materialId: defectRecord.cuttingJob?.material?.id,
				summa: defectRecord.finalAmount,
				isDefectReworkOrder: true,
				parentOrderId: defectRecord.id,
			};

			await createOrder(payload).unwrap();

			message.success("Создана повторная оклейка");
			setIsDefectModalOpen(false);
			setDefectRecord(null);
		} catch (e) {
			message.error(e?.data?.message || "Ошибка при создании повторной оклейки");
		}
	};

	// ── Тег статуса гарантии ─────────────────────────────────────────────────
	const warrantyStatusTag = (order) => {
		if (!order.createdAt) return null;

		if (order.isWarrantyOrder) {
			return (
				<Tag color="purple" icon={<SafetyCertificateOutlined />}>
					Гарантийная оклейка
				</Tag>
			);
		}

		const days = Math.floor((Date.now() - new Date(order.createdAt)) / 86400000);

		if (order.warrantyUsed) {
			return (
				<Tag color="red" icon={<CloseCircleOutlined />}>
					Гарантия уже использована
				</Tag>
			);
		}

		if (days > 365) {
			return (
				<Tag color="default" icon={<ExclamationCircleOutlined />}>
					Истекла ({days} дн.)
				</Tag>
			);
		}

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
			title: "Сумма",
			key: "amount",
			render: (_, r) => (
				<Space direction="vertical" size={0}>
					{r.discount && (
						<span style={{ textDecoration: "line-through", color: "#999", fontSize: 11 }}>
							{r.totalAmount} сом
						</span>
					)}
					<strong>{r.finalAmount} сом</strong>
				</Space>
			),
		},
		{
			title: "Скидка",
			key: "discount",
			render: (_, r) =>
				r.discount ? (
					<Tooltip title={r.discount.description}>
						<Tag color="volcano" icon={<TagOutlined />}>
							{RULE_LABEL[r.discount.rule] ?? r.discount.name}
						</Tag>
					</Tooltip>
				) : (
					"—"
				),
		},
		{
			title: "Статус",
			key: "status",
			render: (_, r) => (
				<Tag color={STATUS_COLOR[r.status] ?? "default"}>
					{STATUS_LABEL[r.status] ?? r.status}
				</Tag>
			),
		},
		{
			title: "Действия",
			key: "actions",
			render: (_, r) => (
				<Space wrap>
					{r.status !== "DONE" && r.status !== "DEFECT" && (
						<>
							<Button
								type="primary"
								size="small"
								onClick={() => handleStatusChange(r.id, "DONE")}
							>
								Провести
							</Button>
							<Button
								danger
								size="small"
								onClick={() => {
									setDefectRecord(r);
									setIsDefectModalOpen(true);
								}}
							>
								Брак
							</Button>
						</>
					)}
				</Space>
			),
		},
	];

	return (
		<div style={{ padding: isMobile ? "12px 12px 24px" : "16px 20px" }}>
			<div
				style={{
					display: "flex",
					alignItems: isMobile ? "stretch" : "center",
					justifyContent: "space-between",
					marginBottom: 16,
					flexDirection: isMobile ? "column" : "row",
					gap: 10,
				}}
			>
				<h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26 }}>✂️ Создать резку</h2>

				<Button
					icon={<SafetyCertificateOutlined />}
					style={{
						background: "#6c5ce7",
						color: "#fff",
						border: "none",
						borderRadius: 10,
						height: isMobile ? 44 : undefined,
						width: isMobile ? "100%" : "auto",
					}}
					onClick={() => setWarrantyDrawerOpen(true)}
				>
					Гарантия 365 дней
				</Button>
			</div>

			<CardGrid
				title="📱 Устройство *"
				data={deviceTypes.filter((d) => d.isActive !== false)}
				selected={selectedDevice}
				onSelect={setSelectedDevice}
				onAddNew={() => openCreateTypeModal("device")}
				isMobile={isMobile}
				renderCard={(item, sel, onSel, mobile) => (
					<DeviceCard key={item.id} item={item} selected={sel} onSelect={onSel} isMobile={mobile} />
				)}
			/>

			<CardGrid
				title="🛡 Материал *"
				data={materials.filter((m) => m.isActive !== false)}
				selected={selectedMaterial}
				onSelect={setSelectedMaterial}
				onAddNew={() => openCreateTypeModal("material")}
				isMobile={isMobile}
				renderCard={(item, sel, onSel, mobile) => (
					<MaterialCard key={item.id} item={item} selected={sel} onSelect={onSel} isMobile={mobile} />
				)}
			/>

			<CardGrid
				title="✂️ Тип резки *"
				data={armorTypes.filter((a) => a.isActive !== false)}
				selected={selectedArmor}
				onSelect={setSelectedArmor}
				onAddNew={() => openCreateTypeModal("armor")}
				isMobile={isMobile}
				renderCard={(item, sel, onSel, mobile) => (
					<ArmorCard key={item.id} item={item} selected={sel} onSelect={onSel} isMobile={mobile} />
				)}
			/>

			<Divider style={{ margin: "12px 0" }} />

			<Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
				<Col xs={24} sm={12} md={6}>
					<Select
						size="large"
						showSearch
						allowClear
						placeholder="Скидка (опционально)"
						style={{ width: "100%" }}
						value={selectedDiscount?.id ?? null}
						optionFilterProp="children"
						onChange={(id) => {
							setSelectedDiscount(id ? discounts.find((d) => d.id === id) ?? null : null);
							setManualSumma(false);
						}}
					>
						{discounts
							.filter((d) => d.isActive)
							.map((d) => (
								<Option key={d.id} value={d.id}>
									<Space>
										<TagOutlined />
										{d.name ?? RULE_LABEL[d.rule]}
										<span style={{ color: "#999", fontSize: 12 }}>
											{d.type === "PERCENT"
												? `−${d.value}%`
												: d.type === "PRICE_OVERRIDE"
													? `= ${d.value} сом`
													: `−${d.value} сом`}
										</span>
									</Space>
								</Option>
							))}
					</Select>
				</Col>

				<Col xs={12} sm={6} md={3}>
					<InputNumber
						size="large"
						min={1}
						value={quantity}
						onChange={(v) => setQuantity(v ?? 1)}
						placeholder="Кол-во"
						style={{ width: "100%" }}
					/>
				</Col>

				<Col xs={12} sm={6} md={4}>
					<InputNumber
						size="large"
						value={summa}
						onChange={(v) => {
							setSumma(v);
							setManualSumma(true);
						}}
						placeholder="Итого (сом)"
						style={{ width: "100%" }}
						addonAfter={
							selectedDiscount && discountAmount > 0 ? (
								<Tooltip title={`Скидка: −${Math.round(discountAmount)} сом`}>
									<PercentageOutlined style={{ color: "#f5222d" }} />
								</Tooltip>
							) : null
						}
					/>
					{selectedDiscount && discountAmount > 0 && (
						<div style={{ fontSize: 11, color: "#f5222d", marginTop: 2 }}>
							−{Math.round(discountAmount)} сом (было {baseSumma} сом)
						</div>
					)}
				</Col>

				<Col xs={24} sm={6} md={3}>
					<Button
						type="primary"
						onClick={handleCreateClick}
						block
						size="large"
						style={{ background: "#6c5ce7", border: "none", height: 44 }}
					>
						Начать резку
					</Button>
				</Col>
			</Row>

			<Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
				<Col xs={24} sm={12} md={6}>
					<Input
						size="large"
						placeholder="Телефон клиента *"
						value={clientPhone}
						onChange={(e) => setClientPhone(e.target.value)}
					/>
				</Col>

				<Col xs={24} sm={12} md={6}>
					<Input
						size="large"
						placeholder="Имя клиента (опционально)"
						value={clientName}
						onChange={(e) => setClientName(e.target.value)}
					/>
				</Col>

				<Col xs={24} sm={12} md={6}>
					<Input
						size="large"
						placeholder="Email (опционально)"
						value={clientEmail}
						onChange={(e) => setClientEmail(e.target.value)}
					/>
				</Col>

				<Col xs={24} md={12}>
					<Input.TextArea
						placeholder="Заметки..."
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						autoSize={{ minRows: isMobile ? 3 : 1, maxRows: 4 }}
					/>
				</Col>
			</Row>

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

			<Divider orientation="left">Заказы</Divider>

			<Table
				dataSource={cuttingJobs}
				columns={columns}
				rowKey="id"
				size={isMobile ? "middle" : "small"}
				loading={isLoading}
				bordered
				scroll={{ x: 900 }}
				pagination={{
					pageSize: 20,
					showSizeChanger: true,
					showTotal: (t) => `Всего: ${t}`,
				}}
			/>

			<Modal
				title="Подтвердите создание резки"
				open={isModalOpen}
				width={isMobile ? "95%" : 520}
				onOk={handleConfirmOrder}
				onCancel={() => setIsModalOpen(false)}
				okText="Создать"
				cancelText="Отмена"
			>
				<Space direction="vertical" style={{ width: "100%" }}>
					<Tag color="purple">📱 {selectedDevice?.name}</Tag>
					<Tag color="green">🛡 {selectedMaterial?.name}</Tag>
					<Tag color="gold">✂️ {selectedArmor?.name}</Tag>
					<p>
						Количество: <strong>{quantity}</strong>
					</p>
					<p>
						Сумма:{" "}
						{selectedDiscount && discountAmount > 0 ? (
							<>
								{selectedDiscount.type === "PRICE_OVERRIDE" ? (
									<>
										<strong style={{ color: "#f5222d" }}>
											{selectedDiscount.value} сом
										</strong>
										<Tag color="volcano" style={{ marginLeft: 4 }}>
											{RULE_LABEL[selectedDiscount.rule] ?? selectedDiscount.name}
										</Tag>
									</>
								) : (
									<>
										<span style={{ textDecoration: "line-through", color: "#999" }}>
											{baseSumma} сом
										</span>{" "}
										<strong style={{ color: "#f5222d" }}>{summa} сом</strong>
										<Tag color="volcano" style={{ marginLeft: 4 }}>
											{RULE_LABEL[selectedDiscount.rule] ?? selectedDiscount.name}
										</Tag>
									</>
								)}
							</>
						) : (
							<strong>{summa} сом</strong>
						)}
					</p>

					<p>Телефон: {clientPhone}</p>
					{clientName && <p>Имя: {clientName}</p>}
				</Space>
			</Modal>

			<Modal
				title="Создать задание на резку"
				open={isFileModalOpen}
				width={isMobile ? "95%" : 520}
				onOk={handleCreateCuttingJobWithFile}
				onCancel={() => {
					setIsFileModalOpen(false);
					setFileList([]);
				}}
				okText="Создать и резать"
				cancelText="Отмена"
			>
				<Row gutter={[16, 16]}>
					<Col xs={24}>
						<Upload
							beforeUpload={() => false}
							maxCount={1}
							fileList={fileList}
							onChange={({ fileList: fl }) => setFileList(fl)}
						>
							<Button icon={<UploadOutlined />} size="large">
								Файл (опционально)
							</Button>
						</Upload>
					</Col>

					<Col xs={24} sm={12}>
						<InputNumber
							size="large"
							min={0}
							style={{ width: "100%" }}
							placeholder="Цена за единицу"
							value={price}
							onChange={setPrice}
						/>
					</Col>

					{selectedDiscount && (
						<Col xs={24}>
							<Tag color="volcano" icon={<TagOutlined />}>
								{RULE_LABEL[selectedDiscount.rule] ?? selectedDiscount.name}:{" "}
								{selectedDiscount.type === "PERCENT"
									? `−${selectedDiscount.value}%`
									: selectedDiscount.type === "PRICE_OVERRIDE"
										? `= ${selectedDiscount.value} сом`
										: `−${selectedDiscount.value} сом`}
							</Tag>
						</Col>
					)}
				</Row>
			</Modal>

			<Modal
				title={<span style={{ color: "#f5222d" }}>⚠️ Пометить как брак</span>}
				open={isDefectModalOpen}
				width={isMobile ? "95%" : 520}
				onCancel={() => {
					setIsDefectModalOpen(false);
					setDefectRecord(null);
				}}
				footer={[
					<Button
						key="cancel"
						onClick={() => {
							setIsDefectModalOpen(false);
							setDefectRecord(null);
						}}
					>
						Отмена
					</Button>,
					<Button
						key="repeat"
						type="default"
						style={{
							background: "#6c5ce7",
							color: "#fff",
							border: "none",
						}}
						onClick={handleRepeatFromDefect}
					>
						Повторить
					</Button>,
					<Button
						key="defect"
						danger
						type="primary"
						onClick={handleDefect}
					>
						Подтвердить брак
					</Button>,
				]}
			>
				{defectRecord && (
					<Space direction="vertical">
						<p>
							Вы уверены, что хотите пометить этот заказ как <strong>брак</strong>?
						</p>

						<Tag color="purple">📱 {defectRecord.cuttingJob?.deviceType?.name}</Tag>
						<Tag color="green">🛡 {defectRecord.cuttingJob?.material?.name}</Tag>
						<Tag color="gold">✂️ {defectRecord.cuttingJob?.armorType?.name}</Tag>

						<p>Клиент: {defectRecord.client?.phone}</p>
						<p>Сумма: {defectRecord.finalAmount} сом</p>

						<p style={{ color: "#888", fontSize: 12 }}>
							Можно просто отметить заказ как брак, либо сразу создать повторную оклейку.
						</p>
					</Space>
				)}
			</Modal>

			<Modal
				title={`Создать новый: ${currentType}`}
				open={isCreateTypeModalOpen}
				width={isMobile ? "95%" : 520}
				onOk={handleCreateType}
				onCancel={() => setIsCreateTypeModalOpen(false)}
				okText="Создать"
				cancelText="Отмена"
			>
				<Input
					size="large"
					placeholder="Название *"
					value={newTypeName}
					onChange={(e) => setNewTypeName(e.target.value)}
					style={{ marginBottom: 12 }}
				/>

				{currentType === "device" && (
					<Input
						size="large"
						placeholder="Бренд (опционально)"
						value={deviceBrand}
						onChange={(e) => setDeviceBrand(e.target.value)}
					/>
				)}

				{currentType === "material" && (
					<Space direction="vertical" style={{ width: "100%" }}>
						<Input
							size="large"
							placeholder="Штрихкод"
							value={materialBarcode}
							onChange={(e) => setMaterialBarcode(e.target.value)}
						/>
						<Input
							size="large"
							placeholder="Тип"
							value={materialType}
							onChange={(e) => setMaterialType(e.target.value)}
						/>
						<InputNumber
							size="large"
							placeholder="Толщина"
							value={materialThickness}
							onChange={setMaterialThickness}
							style={{ width: "100%" }}
						/>
						<InputNumber
							size="large"
							placeholder="Цена"
							value={materialPrice}
							onChange={setMaterialPrice}
							style={{ width: "100%" }}
						/>
					</Space>
				)}

				{currentType === "armor" && (
					<Input
						size="large"
						placeholder="Описание"
						value={armorDescription}
						onChange={(e) => setArmorDescription(e.target.value)}
					/>
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
				width={isMobile ? "100%" : 480}
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
						enterButton={<span style={{ padding: "0 8px" }}>Найти</span>}
						size="large"
						loading={historyLoading}
					/>

					{historyLoading && <Spin tip="Загружаем историю..." />}

					{!historyLoading && warrantySearch && !clientHistory && (
						<Empty description="Клиент не найден или заказов нет" />
					)}

					{Array.isArray(clientHistory) && clientHistory.length > 0 && (() => {
						const availableWarrantyOrders = clientHistory.filter((o) => {
							const daysSince = Math.floor(
								(Date.now() - new Date(o.createdAt)) / 86400000
							);

							return !o.isWarrantyOrder && !o.warrantyUsed && daysSince <= 365;
						});

						return (
							<>
								<div
									style={{
										background: "#f0eeff",
										borderRadius: 10,
										padding: "12px 16px",
										border: "1px solid #d9d0ff",
									}}
								>
									<div style={{ fontWeight: 700, fontSize: 15 }}>История клиента</div>
									<div style={{ marginTop: 6 }}>
										<Tag color="purple">Заказов: {clientHistory.length}</Tag>
										{availableWarrantyOrders.length > 0 ? (
											<Tag color="green" icon={<SafetyCertificateOutlined />}>
												Есть доступные гарантии
											</Tag>
										) : (
											<Tag color="default" icon={<ExclamationCircleOutlined />}>
												Нет доступных гарантий
											</Tag>
										)}
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

											const canUseWarranty =
												!order.isWarrantyOrder &&
												!order.warrantyUsed &&
												isWithin365Days &&
												order.status !== "DEFECT";

											const canMarkDefect =
												!order.isWarrantyOrder &&
												isWithin14Days &&
												order.status !== "DEFECT";

											return {
												color: order.isWarrantyOrder
													? "purple"
													: STATUS_COLOR[order.status] ?? "blue",
												children: (
													<div
														style={{
															background: "#fafafa",
															borderRadius: 8,
															padding: "8px 12px",
															border: "1px solid #eee",
															marginBottom: 4,
														}}
													>
														<div
															style={{
																display: "flex",
																justifyContent: "space-between",
																alignItems: "center",
																gap: 8,
															}}
														>
															<strong style={{ fontSize: 13 }}>
																{order.deviceType ?? "—"}
															</strong>
															<span style={{ fontSize: 11, color: "#999" }}>
																{order.createdAt
																	? new Date(order.createdAt).toLocaleDateString("ru-RU")
																	: "—"}
															</span>
														</div>

														<div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
															Материал: {order.material ?? "—"} &nbsp;|&nbsp; Тип:{" "}
															{order.armorType ?? "—"}
														</div>

														<div style={{ fontSize: 12, color: "#666" }}>
															Сумма: <strong>{order.finalAmount} сом</strong>
															{order.isWarrantyOrder && (
																<Tag color="purple" style={{ marginLeft: 6 }}>
																	Гарантийная оклейка
																</Tag>
															)}
														</div>

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

														<Space style={{ marginTop: 8 }} wrap>
															{canUseWarranty && (
																<Button
																	size="small"
																	style={{
																		background: "#6c5ce7",
																		color: "#fff",
																		border: "none",
																	}}
																	icon={<SafetyCertificateOutlined />}
																	onClick={async () => {
																		try {
																			await nuseWarranty(order.id).unwrap();
																			message.success("Гарантийная оклейка создана");
																			setWarrantySearch("");
																			setTimeout(() => setWarrantySearch(warrantyPhone), 300);
																		} catch (e) {
																			message.error(
																				e?.data?.message || "Ошибка применения гарантии"
																			);
																		}
																	}}
																>
																	Использовать гарантию
																</Button>
															)}

															{canMarkDefect && (
																<Button
																	danger
																	size="small"
																	onClick={async () => {
																		try {
																			await changeOrderStatus({
																				id: order.id,
																				status: "DEFECT",
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