import React, { useState, useMemo, useEffect } from 'react';

import {
	Layout,
	Breadcrumb,
	Input,
	Button,
	Card,
	Row,
	Col,
	Modal,
	Form,
	message,
	Spin,
	Empty,
	Tooltip,
	Space,
	Upload,
	Popconfirm,
	Select,
	Tag,
	Divider,
} from 'antd';

import {
	FolderOutlined,
	FileOutlined,
	ArrowLeftOutlined,
	PlusOutlined,
	SearchOutlined,
	HomeOutlined,
	UploadOutlined,
	CloseOutlined,
	ScissorOutlined,
	DeleteOutlined,
	EditOutlined,
	InboxOutlined,
	BoldOutlined,
	DisconnectOutlined,
} from '@ant-design/icons';

import {
	useGetFoldersQuery,
	useCreateFolderMutation,
	useUploadFileMutation,
	useUpdateFolderMutation,
	useDeleteFolderMutation,
	useDeleteFileMutation,
	useUpdateFileMutation,
} from '../store/api/fileApi';

import { useCreateSimpleOrderMutation } from '../store/api/orderApi';

import { useCameoBluetooth } from '../hooks/useCameoBluetooth';

const { Content } = Layout;
const { Dragger } = Upload;


/* ============================================================
	 BUILD FOLDER PATH
============================================================ */

const buildFolderPath = (folderId, allFolders) => {
	if (!folderId) return '';

	const pathSegments = [];
	let currentId = folderId;

	for (let depth = 0; depth < 10; depth++) {
		const currentFolder = allFolders.find(
			(f) => f.id === currentId
		);

		if (!currentFolder) {
			break;
		}

		pathSegments.unshift(
			currentFolder.name
		);

		const parentFolder = allFolders.find(
			(f) =>
				f.children?.some(
					(child) =>
						child.id === currentId
				)
		);

		if (parentFolder) {
			currentId = parentFolder.id;
		} else {
			break;
		}
	}

	return pathSegments.join('/');
};


/* ============================================================
	 ALLOWED FILES
============================================================ */

const ALLOWED_EXTENSIONS = ['.eps'];

const isAllowedFile = (fileName = '') =>
	ALLOWED_EXTENSIONS.some((ext) =>
		fileName
			.toLowerCase()
			.endsWith(ext)
	);


/* ============================================================
	 COMPONENT
============================================================ */

export default function FolderManager() {

	/* ==========================================================
		 API
	========================================================== */

	const {
		data: folders = [],
		isLoading: isFetchLoading,
		refetch: refetchFolders,
	} = useGetFoldersQuery();

	const [
		createFolder,
		{ isLoading: isCreating },
	] = useCreateFolderMutation();

	const [
		uploadFile,
		{ isLoading: isUploading },
	] = useUploadFileMutation();

	const [
		createOrder,
		{ isLoading: isOrderCreating },
	] = useCreateSimpleOrderMutation();

	const [
		updateFolder,
	] = useUpdateFolderMutation();

	const [
		deleteFolder,
	] = useDeleteFolderMutation();

	const [
		updateFile,
	] = useUpdateFileMutation();

	const [
		deleteFile,
	] = useDeleteFileMutation();


	/* ==========================================================
		 CAMEO BLUETOOTH
	========================================================== */

	const {
		device: cameoDevice,

		connected: cameoConnected,

		connecting: cameoConnecting,

		sending: cameoSending,

		characteristics:
		cameoCharacteristics,

		selectedCharacteristic:
		cameoCharacteristic,

		status: cameoStatus,

		connect: connectCameo,

		selectCharacteristic:
		selectCameoCharacteristic,

		disconnect:
		disconnectCameo,

		sendPlt,
	} = useCameoBluetooth();


	/* ==========================================================
		 STATE
	========================================================== */

	const [
		history,
		setHistory,
	] = useState([
		{
			id: null,
			name: 'Корневая папка',
		},
	]);

	const [
		searchQuery,
		setSearchQuery,
	] = useState('');

	const [
		selectedFile,
		setSelectedFile,
	] = useState(null);

	const [
		isCuttingLoading,
		setIsCuttingLoading,
	] = useState(false);

	const [
		isDragActive,
		setIsDragActive,
	] = useState(false);

	const [
		sortBy,
		setSortBy,
	] = useState('date');

	const [
		isModalOpen,
		setIsModalOpen,
	] = useState(false);

	const [
		renameTarget,
		setRenameTarget,
	] = useState(null);

	const [
		previewSrc,
		setPreviewSrc,
	] = useState('');


	const [form] =
		Form.useForm();

	const [renameForm] =
		Form.useForm();


	/* ==========================================================
		 CURRENT FOLDER
	========================================================== */

	const currentFolder = useMemo(
		() =>
			history[
			history.length - 1
			],
		[history]
	);


	/* ==========================================================
		 FILE VALIDATION
	========================================================== */

	const beforeUpload = (file) => {
		if (!isAllowedFile(file.name)) {
			message.error(
				`Файл "${file.name}" отклонён: принимаются только файлы формата .eps`
			);

			return Upload.LIST_IGNORE;
		}

		return true;
	};


	/* ==========================================================
		 UPLOAD
	========================================================== */

	const handleUpload = async (
		options
	) => {
		const {
			file,
			onSuccess,
			onError,
		} = options;

		const formData =
			new FormData();

		formData.append(
			'file',
			file
		);

		if (
			currentFolder.id !== null
		) {
			formData.append(
				'folderId',
				currentFolder.id
			);
		}

		try {
			await uploadFile(
				formData
			).unwrap();

			message.success(
				`Файл "${file.name}" успешно загружен`
			);

			onSuccess?.('ok');

			await refetchFolders();
		} catch (err) {
			message.error(
				err?.data?.message ||
				`Не удалось загрузить файл "${file.name}"`
			);

			onError?.(err);
		}
	};


	/* ==========================================================
		 CREATE FOLDER
	========================================================== */

	const handleCreateFolder = async (
		values
	) => {
		try {
			await createFolder({
				name: values.name,
				parentId:
					currentFolder.id,
			}).unwrap();

			message.success(
				`Папка "${values.name}" создана`
			);

			setIsModalOpen(false);

			form.resetFields();

			await refetchFolders();
		} catch (err) {
			message.error(
				err?.data?.message ||
				'Ошибка при создании папки'
			);
		}
	};


	/* ==========================================================
		 RENAME
	========================================================== */

	const handleRename = async (
		values
	) => {
		if (!renameTarget) {
			return;
		}

		try {
			if (
				renameTarget.type ===
				'folder'
			) {
				await updateFolder({
					id: renameTarget.id,
					name: values.newName,
				}).unwrap();

				message.success(
					'Папка успешно переименована'
				);
			} else {
				const extension =
					renameTarget.extension ||
					'';

				const finalName =
					`${values.newName}${extension}`;

				await updateFile(
					{
						id: renameTarget.id,
						name: finalName,
					},
					renameTarget.id
				).unwrap();

				message.success(
					'Файл успешно переименован'
				);

				if (
					selectedFile?.id ===
					renameTarget.id
				) {
					setSelectedFile(
						(prev) => ({
							...prev,
							name: finalName,
						})
					);
				}
			}

			await refetchFolders();

			setRenameTarget(null);

			renameForm.resetFields();
		} catch (err) {
			message.error(
				err?.data?.message ||
				'Ошибка при переименовании'
			);
		}
	};


	/* ==========================================================
		 DELETE FOLDER
	========================================================== */

	const handleDeleteFolder = async (
		id,
		e
	) => {
		e?.stopPropagation();

		try {
			await deleteFolder(
				id
			).unwrap();

			message.success(
				'Папка удалена'
			);

			await refetchFolders();
		} catch (err) {
			message.error(
				err?.data?.message ||
				'Не удалось удалить папку'
			);
		}
	};


	/* ==========================================================
		 DELETE FILE
	========================================================== */

	const handleDeleteFile = async (
		id
	) => {
		try {
			await deleteFile(
				id
			).unwrap();

			message.success(
				'Файл удален'
			);

			await refetchFolders();

			setSelectedFile(null);
		} catch (err) {
			message.error(
				err?.data?.message ||
				'Не удалось удалить файл'
			);
		}
	};


	/* ==========================================================
		 BREADCRUMB
	========================================================== */

	const handleBreadcrumbClick = (
		index
	) => {
		setHistory(
			history.slice(
				0,
				index + 1
			)
		);

		setSearchQuery('');

		setSelectedFile(null);
	};


	/* ==========================================================
		 OPEN FOLDER
	========================================================== */

	const handleFolderClick = (
		folderId,
		folderName
	) => {
		setHistory([
			...history,
			{
				id: folderId,
				name: folderName,
			},
		]);

		setSearchQuery('');

		setSelectedFile(null);
	};


	/* ==========================================================
		 SORT
	========================================================== */

	const sortItems = (
		items
	) => {
		const data = [
			...items,
		];

		if (
			sortBy === 'name'
		) {
			return data.sort(
				(a, b) =>
					(a.name || '')
						.localeCompare(
							b.name || '',
							'ru',
							{
								sensitivity:
									'base',
							}
						)
			);
		}

		return data.sort(
			(a, b) =>
				new Date(
					b.createdAt ||
					b.created_at ||
					0
				) -
				new Date(
					a.createdAt ||
					a.created_at ||
					0
				)
		);
	};


	/* ==========================================================
		 VISIBLE FILES
	========================================================== */

	const {
		visibleFolders,
		visibleFiles,
	} = useMemo(() => {

		if (
			searchQuery.trim() !== ''
		) {
			const query =
				searchQuery.toLowerCase();

			const filteredFolders =
				folders.filter(
					(f) =>
						f.name
							.toLowerCase()
							.includes(
								query
							)
				);

			const filteredFiles =
				[];

			folders.forEach(
				(f) => {
					if (!f.files) {
						return;
					}

					f.files.forEach(
						(file) => {
							const fileName =
								file.name?.toLowerCase() ||
								'';

							if (
								fileName.includes(
									query
								) &&
								!fileName.endsWith(
									'.plt'
								)
							) {
								const fullPath =
									buildFolderPath(
										f.id,
										folders
									);

								filteredFiles.push(
									{
										...file,
										folderName:
											f.name,
										folderPath:
											fullPath,
									}
								);
							}
						}
					);
				}
			);

			return {
				visibleFolders:
					sortItems(
						filteredFolders
					),

				visibleFiles:
					sortItems(
						filteredFiles
					),
			};
		}


		if (
			currentFolder.id ===
			null
		) {
			const allChildrenIds =
				new Set(
					folders.flatMap(
						(f) =>
							f.children?.map(
								(child) =>
									child.id
							) || []
					)
				);

			const rootFolders =
				folders.filter(
					(f) =>
						!allChildrenIds.has(
							f.id
						)
				);

			return {
				visibleFolders:
					sortItems(
						rootFolders
					),

				visibleFiles: [],
			};
		}


		const activeData =
			folders.find(
				(f) =>
					f.id ===
					currentFolder.id
			);

		const fullPath =
			buildFolderPath(
				currentFolder.id,
				folders
			);

		const files =
			(
				activeData?.files ||
				[]
			)
				.filter(
					(file) =>
						!file.name
							.toLowerCase()
							.endsWith(
								'.plt'
							)
				)
				.map(
					(file) => ({
						...file,
						folderName:
							activeData?.name,
						folderPath:
							fullPath,
					})
				);

		return {
			visibleFolders:
				sortItems(
					activeData?.children ||
					[]
				),

			visibleFiles:
				sortItems(files),
		};

	}, [
		folders,
		currentFolder,
		searchQuery,
		sortBy,
	]);


	/* ==========================================================
		 SELECTED FILE URL
	========================================================== */

	const selectedFileSrc =
		useMemo(() => {
			if (!selectedFile) {
				return '';
			}

			const host =
				'https://ocleon.333.kg';

			const folderPath =
				selectedFile.path
					? `/${selectedFile.path}`
					: '';

			return `${host}${folderPath}`;
		}, [
			selectedFile,
		]);


	/* ==========================================================
		 SVG PREVIEW
	========================================================== */

	useEffect(() => {
		if (!selectedFileSrc) {
			setPreviewSrc('');
			return;
		}

		let objectUrl = null;
		let cancelled = false;

		const loadPreview =
			async () => {
				try {
					const response =
						await fetch(
							selectedFileSrc
						);

					if (
						!response.ok
					) {
						throw new Error(
							`HTTP ${response.status}`
						);
					}

					const svgText =
						await response.text();

					if (
						!svgText.includes(
							'<svg'
						)
					) {
						if (
							!cancelled
						) {
							setPreviewSrc(
								selectedFileSrc
							);
						}

						return;
					}

					const parser =
						new DOMParser();

					const doc =
						parser.parseFromString(
							svgText,
							'image/svg+xml'
						);

					const svg =
						doc.documentElement;

					const paths =
						svg.querySelectorAll(
							'path'
						);

					paths.forEach(
						(path) => {
							const style =
								path.getAttribute(
									'style'
								) || '';

							const match =
								style.match(
									/stroke-width\s*:\s*([0-9.]+)/
								);

							if (!match) {
								return;
							}

							const width =
								Number(
									match[1]
								);

							if (
								width < 1
							) {
								path.setAttribute(
									'style',
									style.replace(
										/stroke-width\s*:\s*[0-9.]+/,
										'stroke-width:8'
									)
								);
							}
						}
					);

					const serializer =
						new XMLSerializer();

					const modifiedSvg =
						serializer.serializeToString(
							doc
						);

					const blob =
						new Blob(
							[
								modifiedSvg,
							],
							{
								type:
									'image/svg+xml',
							}
						);

					objectUrl =
						URL.createObjectURL(
							blob
						);

					if (
						!cancelled
					) {
						setPreviewSrc(
							objectUrl
						);
					}
				} catch (error) {
					console.error(
						'Ошибка подготовки SVG превью:',
						error
					);

					if (
						!cancelled
					) {
						setPreviewSrc(
							selectedFileSrc
						);
					}
				}
			};

		loadPreview();

		return () => {
			cancelled = true;

			if (objectUrl) {
				URL.revokeObjectURL(
					objectUrl
				);
			}
		};
	}, [
		selectedFileSrc,
	]);


	/* ==========================================================
		 CONNECT CAMEO
	========================================================== */

	const handleConnectCameo =
		async () => {
			try {
				await connectCameo();

				message.success(
					'Cameo успешно подключён'
				);
			} catch (error) {
				console.error(
					'Ошибка подключения Cameo:',
					error
				);

				message.error(
					error?.message ||
					'Не удалось подключить Silhouette Cameo'
				);
			}
		};


	/* ==========================================================
		 DISCONNECT CAMEO
	========================================================== */

	const handleDisconnectCameo =
		async () => {
			try {
				await disconnectCameo();

				message.success(
					'Cameo отключён'
				);
			} catch (error) {
				console.error(
					'Ошибка отключения Cameo:',
					error
				);
			}
		};


	/* ==========================================================
		 SELECT CHARACTERISTIC
	========================================================== */

	const handleCharacteristicChange =
		(value) => {

			const characteristic =
				cameoCharacteristics.find(
					(item) =>
						item.id ===
						value ||
						item.uuid ===
						value
				);

			if (
				!characteristic
			) {
				return;
			}

			selectCameoCharacteristic(
				characteristic
			);
		};


	/* ==========================================================
		 SEND FILE TO CAMEO
	========================================================== */

	const handleJustCut =
		async () => {

			if (!selectedFile) {
				message.warning(
					'Сначала выберите файл'
				);

				return;
			}


			/* -----------------------------------------------
				 CHECK BLUETOOTH
			------------------------------------------------ */

			if (!cameoConnected) {
				message.warning(
					'Сначала подключите Silhouette Cameo 5'
				);

				return;
			}


			if (
				!cameoCharacteristic
			) {
				message.warning(
					'Сначала выберите BLE characteristic Cameo'
				);

				return;
			}


			setIsCuttingLoading(
				true
			);


			try {

				const host =
					'https://ocleon.333.kg';

				const diskHost =
					host;


				/* ---------------------------------------------
					 GET SELECTED PATH
				--------------------------------------------- */

				const selectedPath =
					selectedFile.path ||
					'';

				const pathWithoutExtension =
					selectedPath.replace(
						/\.[^/.]+$/,
						''
					);

				const folderPath =
					pathWithoutExtension.includes(
						'/'
					)
						? pathWithoutExtension.substring(
							0,
							pathWithoutExtension.lastIndexOf(
								'/'
							)
						)
						: '';

				const baseName =
					pathWithoutExtension.substring(
						pathWithoutExtension.lastIndexOf(
							'/'
						) + 1
					);


				/* ---------------------------------------------
					 FIND EPS / CDR
				--------------------------------------------- */

				let fileBlob = null;
				let finalFileName = '';
				let foundExt = '';

				const extensions = [
					'eps',
					'cdr',
				];


				for (
					const ext of extensions
				) {

					const currentFileName =
						`${baseName}.${ext}`;

					const currentFileUrl =
						`${diskHost}${folderPath ? `/${folderPath}` : ''}/${currentFileName}`;

					console.log(
						`Проверяем наличие файла: ${currentFileUrl}`
					);

					try {

						const response =
							await fetch(
								currentFileUrl
							);

						if (
							response.ok
						) {

							fileBlob =
								await response.blob();

							finalFileName =
								currentFileName;

							foundExt =
								ext;

							console.log(
								`Файл найден: ${currentFileName}`
							);

							break;
						}

						console.log(
							`Файл не найден: ${currentFileName}. HTTP ${response.status}`
						);

					} catch (
					fetchError
					) {

						console.warn(
							`Ошибка при проверке ${currentFileName}`,
							fetchError
						);
					}
				}


				/* ---------------------------------------------
					 FALLBACK BY SELECTED FILE NAME
				--------------------------------------------- */

				if (
					!fileBlob &&
					selectedFile.name
				) {

					const selectedNameWithoutExtension =
						selectedFile.name.replace(
							/\.[^/.]+$/,
							''
						);

					for (
						const ext of extensions
					) {

						const currentFileName =
							`${selectedNameWithoutExtension}.${ext}`;

						const currentFileUrl =
							`${diskHost}${folderPath ? `/${folderPath}` : ''}/${currentFileName}`;

						console.log(
							`Дополнительно проверяем: ${currentFileUrl}`
						);

						try {

							const response =
								await fetch(
									currentFileUrl
								);

							if (
								response.ok
							) {

								fileBlob =
									await response.blob();

								finalFileName =
									currentFileName;

								foundExt =
									ext;

								console.log(
									`Файл найден дополнительной проверкой: ${currentFileName}`
								);

								break;
							}

						} catch (
						fetchError
						) {

							console.warn(
								`Ошибка при проверке ${currentFileName}`,
								fetchError
							);
						}
					}
				}


				/* ---------------------------------------------
					 FILE NOT FOUND
				--------------------------------------------- */

				if (!fileBlob) {
					throw new Error(
						`Не найден файл для резки: ${baseName}.eps или ${baseName}.cdr`
					);
				}


				/* ---------------------------------------------
					 CDR -> EPS
				--------------------------------------------- */

				if (
					foundExt ===
					'cdr'
				) {

					console.log(
						`Файл ${finalFileName} — .cdr, конвертируем в .eps...`
					);

					const cdrFormData =
						new FormData();

					cdrFormData.append(
						'file',
						fileBlob,
						finalFileName
					);

					const cdrResponse =
						await fetch(
							`${host}/folder/cdr-to-eps`,
							{
								method:
									'POST',
								body:
									cdrFormData,
								redirect:
									'follow',
							}
						);

					if (
						!cdrResponse.ok
					) {
						throw new Error(
							'Не удалось сконвертировать .cdr файл в .eps'
						);
					}

					fileBlob =
						await cdrResponse.blob();

					finalFileName =
						finalFileName.replace(
							/\.cdr$/i,
							'.eps'
						);

					foundExt =
						'eps';

					message.success(
						'Файл .cdr успешно сконвертирован в .eps'
					);
				}


				/* ---------------------------------------------
					 EPS -> PLT
				--------------------------------------------- */

				if (
					foundExt ===
					'eps'
				) {

					console.log(
						`Файл ${finalFileName} — .eps, конвертируем в .plt...`
					);

					const convertFormData =
						new FormData();

					convertFormData.append(
						'file',
						fileBlob,
						finalFileName
					);

					const convertResponse =
						await fetch(
							`${host}/folder/convert`,
							{
								method:
									'POST',
								body:
									convertFormData,
								redirect:
									'follow',
							}
						);

					if (
						!convertResponse.ok
					) {
						throw new Error(
							'Не удалось сконвертировать .eps файл в .plt'
						);
					}

					fileBlob =
						await convertResponse.blob();

					finalFileName =
						finalFileName.replace(
							/\.eps$/i,
							'.plt'
						);

					foundExt =
						'plt';

					message.success(
						'Файл .eps успешно сконвертирован в .plt'
					);
				}


				/* ---------------------------------------------
					 PLT -> TEXT
				--------------------------------------------- */

				const pltText =
					await fileBlob.text();

				if (
					!pltText.trim()
				) {
					throw new Error(
						'PLT файл пустой'
					);
				}


				console.log(
					'===================================='
				);

				console.log(
					'PLT размер:',
					pltText.length
				);

				console.log(
					'PLT preview:',
					pltText.substring(
						0,
						2000
					)
				);

				console.log(
					'===================================='
				);


				/* ---------------------------------------------
					 SEND PLT -> CAMEO
				--------------------------------------------- */

				message.loading({
					content:
						'Отправляем задание на Cameo...',
					key:
						'cameo-cut',
					duration:
						0,
				});


				await sendPlt(
					pltText,
					{
						speed: 3,
						force: 5,
						tool: 1,
					}
				);


				message.success({
					content:
						`Задание "${finalFileName}" отправлено на Cameo 5`,
					key:
						'cameo-cut',
				});


				/* ---------------------------------------------
					 CREATE CRM ORDER
				--------------------------------------------- */

				try {

					await createOrder({
						fileId:
							selectedFile.id,
					}).unwrap();

					message.success(
						'Накладная зарегистрирована в CRM'
					);

				} catch (
				orderError
				) {

					console.error(
						'Ошибка создания накладной:',
						orderError
					);

					message.error(
						orderError?.data?.message ||
						'Резка отправлена на станок, но не удалось создать накладную в CRM'
					);
				}

			} catch (
			error
			) {

				console.error(
					'Ошибка резки:',
					error
				);

				message.error({
					content:
						error?.data?.message ||
						error?.message ||
						'Ошибка при запуске резки',
					key:
						'cameo-cut',
				});

			} finally {

				setIsCuttingLoading(
					false
				);
			}
		};


	/* ==========================================================
		 LOADING
	========================================================== */

	const isCutting =
		isCuttingLoading ||
		isOrderCreating ||
		cameoSending;


	/* ==========================================================
		 RENDER
	========================================================== */

	return (
		<Layout
			style={{
				minHeight:
					'calc(100vh - 140px)',
				background:
					'#f5f5f5',
			}}
		>

			<style>{`
				.file-manager-dropzone .ant-upload.ant-upload-drag {
					background: transparent;
					border: none;
					padding: 0;
				}

				.file-manager-dropzone.drag-active {
					outline: 2px dashed #1890ff;
					outline-offset: 6px;
					background: rgba(24, 144, 255, 0.04);
					border-radius: 12px;
				}
			`}</style>


			<Content
				style={{
					maxWidth:
						'1900px',
					width:
						'calc(100% - 24px)',
					margin:
						'0 auto',
				}}
			>


				{/* =================================================
				    TOOLBAR
				================================================= */}

				<Row
					gutter={[
						16,
						16,
					]}
					justify="space-between"
					align="middle"
					style={{
						marginBottom:
							12,
					}}
				>

					<Col
						xs={24}
						sm={12}
						md={8}
					>

						<Input
							placeholder="Поиск папок и файлов..."
							prefix={
								<SearchOutlined
									style={{
										color:
											'#bfbfbf',
									}}
								/>
							}
							value={
								searchQuery
							}
							onChange={(
								e
							) => {
								setSearchQuery(
									e.target.value
								);

								setSelectedFile(
									null
								);
							}}
							allowClear
						/>

					</Col>


					<Col
						xs={24}
						sm={8}
						md={4}
					>

						<Select
							style={{
								width:
									'100%',
							}}
							value={
								sortBy
							}
							onChange={
								setSortBy
							}
							options={[
								{
									value:
										'date',
									label:
										'По дате',
								},
								{
									value:
										'name',
									label:
										'По названию',
								},
							]}
						/>

					</Col>


					<Col>

						<Space wrap>

							{history.length >
								1 &&
								!searchQuery && (
									<Button
										icon={
											<ArrowLeftOutlined />
										}
										onClick={() => {
											setHistory(
												history.slice(
													0,
													-1
												)
											);

											setSelectedFile(
												null
											);
										}}
									>
										Назад
									</Button>
								)}


							<Upload
								accept=".eps"
								beforeUpload={
									beforeUpload
								}
								customRequest={
									handleUpload
								}
								showUploadList={
									false
								}
								disabled={
									isUploading ||
									isFetchLoading
								}
							>

								<Button
									icon={
										<UploadOutlined />
									}
									loading={
										isUploading
									}
									disabled={
										isFetchLoading
									}
								>
									Загрузить файл (.eps)
								</Button>

							</Upload>


							<Button
								type="primary"
								icon={
									<PlusOutlined />
								}
								onClick={() =>
									setIsModalOpen(
										true
									)
								}
								disabled={
									isFetchLoading
								}
							>
								Создать папку
							</Button>

						</Space>

					</Col>

				</Row>


				{/* =================================================
				    CAMEO PANEL
				================================================= */}

				<Card
					size="small"
					style={{
						marginBottom:
							16,
						borderRadius:
							10,
					}}
				>

					<Row
						gutter={[
							12,
							12,
						]}
						align="middle"
					>

						<Col
							xs={24}
							md={7}
						>

							<Space>

								<BoldOutlined
									style={{
										fontSize:
											22,
										color:
											cameoConnected
												? '#52c41a'
												: '#8c8c8c',
									}}
								/>

								<div>

									<div
										style={{
											fontWeight:
												600,
										}}
									>
										Silhouette Cameo 5
									</div>

									<div
										style={{
											fontSize:
												12,
											color:
												'#8c8c8c',
										}}
									>
										{cameoConnected
											? (
												cameoDevice?.name ||
												'Подключено'
											)
											: 'Не подключено'}
									</div>

								</div>

							</Space>

						</Col>


						<Col
							xs={24}
							md={5}
						>

							{cameoConnected ? (
								<Tag
									color="success"
								>
									Подключено
								</Tag>
							) : (
								<Tag>
									Не подключено
								</Tag>
							)}

							{cameoStatus && (
								<div
									style={{
										fontSize:
											12,
										color:
											'#8c8c8c',
										marginTop:
											4,
									}}
								>
									{cameoStatus}
								</div>
							)}

						</Col>


						<Col
							xs={24}
							md={7}
						>

							<Select
								style={{
									width:
										'100%',
								}}
								placeholder="Выберите BLE characteristic"
								disabled={
									!cameoConnected ||
									cameoCharacteristics.length ===
									0
								}
								value={
									cameoCharacteristic?.id ||
									cameoCharacteristic?.uuid ||
									undefined
								}
								onChange={
									handleCharacteristicChange
								}
								options={cameoCharacteristics.map(
									(
										characteristic,
										index
									) => ({
										value:
											characteristic.id ||
											characteristic.uuid,

										label:
											characteristic.name ||
											`Characteristic ${index + 1} — ${characteristic.uuid}`,
									})
								)}
							/>

						</Col>


						<Col
							xs={24}
							md={5}
						>

							{!cameoConnected ? (

								<Button
									type="primary"
									block
									icon={
										<BoldOutlined />
									}
									loading={
										cameoConnecting
									}
									onClick={
										handleConnectCameo
									}
								>
									Подключить Cameo
								</Button>

							) : (

								<Button
									block
									danger
									icon={
										<DisconnectOutlined />
									}
									onClick={
										handleDisconnectCameo
									}
								>
									Отключить
								</Button>

							)}

						</Col>

					</Row>


					{cameoConnected &&
						cameoCharacteristics.length >
						0 && (

							<>
								<Divider
									style={{
										margin:
											'12px 0',
									}}
								/>

								<div
									style={{
										fontSize:
											12,
										color:
											'#8c8c8c',
									}}
								>

									Найдено BLE
									characteristics:{' '}

									<strong>
										{
											cameoCharacteristics.length
										}
									</strong>


									{cameoCharacteristic && (
										<>
											{' '}
											· Выбрана:{' '}

											<strong>
												{
													cameoCharacteristic.uuid
												}
											</strong>
										</>
									)}

								</div>
							</>
						)}

				</Card>


				{/* =================================================
				    BREADCRUMBS
				================================================= */}

				{!searchQuery && (
					<Breadcrumb
						style={{
							marginBottom:
								8,
							fontSize:
								14,
						}}
					>

						{history.map(
							(
								item,
								index
							) => (

								<Breadcrumb.Item
									key={
										index
									}
									style={{
										cursor:
											index <
												history.length -
												1
												? 'pointer'
												: 'default',
									}}
									onClick={() =>
										index <
										history.length -
										1 &&
										handleBreadcrumbClick(
											index
										)
									}
								>

									{index ===
										0 ? (
										<>
											<HomeOutlined />{' '}
											{
												item.name
											}
										</>
									) : (
										item.name
									)}

								</Breadcrumb.Item>

							)
						)}

					</Breadcrumb>
				)}


				{/* =================================================
				    FILE MANAGER
				================================================= */}

				<Dragger
					name="file"
					multiple
					accept=".eps"
					showUploadList={
						false
					}
					beforeUpload={
						beforeUpload
					}
					customRequest={
						handleUpload
					}
					openFileDialogOnClick={
						false
					}
					disabled={
						isFetchLoading
					}
					className={`file-manager-dropzone${isDragActive
						? ' drag-active'
						: ''
						}`}
					onDragEnter={() =>
						setIsDragActive(
							true
						)
					}
					onDragLeave={() =>
						setIsDragActive(
							false
						)
					}
					onDrop={() =>
						setIsDragActive(
							false
						)
					}
				>

					<Spin
						spinning={
							isFetchLoading
						}
						size="large"
						tip="Чтение структуры папок..."
					>

						{visibleFolders.length ===
							0 &&
							visibleFiles.length ===
							0 ? (

							<Empty
								description={
									<span>
										Папка пуста или ничего не найдено

										<br />

										<span
											style={{
												color:
													'#8c8c8c',
												fontSize:
													13,
											}}
										>
											<InboxOutlined />{' '}
											Перетащите .eps файл сюда, чтобы загрузить
										</span>
									</span>
								}
								style={{
									marginTop:
										60,
								}}
							/>

						) : (

							<Row
								gutter={[
									24,
									24,
								]}
							>


								{/* ==========================================
								    FILES GRID
								========================================== */}

								<Col
									xs={24}
									lg={
										selectedFile
											? 16
											: 24
									}
									style={{
										transition:
											'all 0.3s',
										maxHeight:
											'calc(100vh - 160px)',
										overflow:
											'auto',
									}}
								>


									{/* FOLDERS */}

									{visibleFolders.length >
										0 && (

											<div
												style={{
													marginBottom:
														24,
												}}
											>

												<h3
													style={{
														marginBottom:
															12,
														color:
															'#595959',
													}}
												>
													Папки (
													{
														visibleFolders.length
													}
													)
												</h3>


												<Row
													gutter={[
														16,
														16,
													]}
												>

													{visibleFolders.map(
														(
															folder
														) => (

															<Col
																xs={
																	12
																}
																sm={
																	12
																}
																md={
																	8
																}
																lg={
																	selectedFile
																		? 8
																		: 6
																}
																key={
																	folder.id
																}
															>

																<Card
																	hoverable
																	className="folder-card"
																	bodyStyle={{
																		padding:
																			16,
																		display:
																			'flex',
																		alignItems:
																			'center',
																		justifyContent:
																			'space-between',
																		gap:
																			8,
																	}}
																	onClick={() =>
																		handleFolderClick(
																			folder.id,
																			folder.name
																		)
																	}
																	style={{
																		borderRadius:
																			8,
																		border:
																			'1px solid #f0f0f0',
																	}}
																>

																	<div
																		style={{
																			display:
																				'flex',
																			alignItems:
																				'center',
																			gap:
																				12,
																			overflow:
																				'hidden',
																			flex:
																				1,
																		}}
																	>

																		<FolderOutlined
																			style={{
																				fontSize:
																					28,
																				color:
																					'#ffc069',
																				flexShrink:
																					0,
																			}}
																		/>

																		<Tooltip
																			title={
																				folder.name
																			}
																		>

																			<span
																				style={{
																					fontWeight:
																						500,
																					overflow:
																						'hidden',
																					textOverflow:
																						'ellipsis',
																					whiteSpace:
																						'nowrap',
																				}}
																			>
																				{
																					folder.name
																				}
																			</span>

																		</Tooltip>

																	</div>


																	<Space
																		onClick={(
																			e
																		) =>
																			e.stopPropagation()
																		}
																	>

																		<Button
																			type="text"
																			size="small"
																			icon={
																				<EditOutlined
																					style={{
																						color:
																							'#1890ff',
																					}}
																				/>
																			}
																			onClick={() => {
																				setRenameTarget(
																					{
																						type:
																							'folder',
																						id:
																							folder.id,
																						name:
																							folder.name,
																					}
																				);

																				renameForm.setFieldsValue(
																					{
																						newName:
																							folder.name,
																					}
																				);
																			}}
																		/>


																		<Popconfirm
																			title="Удалить папку и всё её содержимое?"
																			onConfirm={(
																				e
																			) =>
																				handleDeleteFolder(
																					folder.id,
																					e
																				)
																			}
																			okText="Да"
																			cancelText="Нет"
																		>

																			<Button
																				type="text"
																				size="small"
																				icon={
																					<DeleteOutlined
																						style={{
																							color:
																								'#ff4d4f',
																						}}
																					/>
																				}
																			/>

																		</Popconfirm>

																	</Space>

																</Card>

															</Col>

														)
													)}

												</Row>

											</div>
										)}


									{/* FILES */}

									{visibleFiles.length >
										0 && (

											<div
												style={{
													marginBottom:
														24,
												}}
											>

												<h3
													style={{
														marginBottom:
															12,
														color:
															'#595959',
													}}
												>
													Файлы (
													{
														visibleFiles.length
													}
													)
												</h3>


												<Row
													gutter={[
														16,
														16,
													]}
												>

													{visibleFiles.map(
														(
															file
														) => {

															const isCurrentSelected =
																selectedFile?.id ===
																file.id;

															return (

																<Col
																	xs={
																		12
																	}
																	sm={
																		12
																	}
																	md={
																		8
																	}
																	lg={
																		selectedFile
																			? 8
																			: 6
																	}
																	key={
																		file.id
																	}
																>

																	<Card
																		hoverable
																		bodyStyle={{
																			padding:
																				16,
																			display:
																				'flex',
																			alignItems:
																				'center',
																			gap:
																				12,
																		}}
																		onClick={() =>
																			setSelectedFile(
																				file
																			)
																		}
																		style={{
																			borderRadius:
																				8,
																			background:
																				isCurrentSelected
																					? '#e6f7ff'
																					: '#fafafa',
																			borderColor:
																				isCurrentSelected
																					? '#1890ff'
																					: '#f0f0f0',
																			boxShadow:
																				isCurrentSelected
																					? '0 0 0 2px rgba(24, 144, 255, 0.2)'
																					: 'none',
																			transition:
																				'all 0.2s',
																		}}
																	>

																		<FileOutlined
																			style={{
																				fontSize:
																					26,
																				color:
																					'#40a9ff',
																				flexShrink:
																					0,
																			}}
																		/>

																		<div
																			style={{
																				overflow:
																					'hidden',
																				textOverflow:
																					'ellipsis',
																				whiteSpace:
																					'nowrap',
																				flex:
																					1,
																			}}
																		>

																			<Tooltip
																				title={`Файл: ${file.name.replace(
																					/\.[^/.]+$/,
																					''
																				)}`}
																			>

																				<span
																					style={{
																						color:
																							'#262626',
																						fontWeight:
																							500,
																					}}
																				>
																					{file.name.replace(
																						/\.[^/.]+$/,
																						''
																					)}
																				</span>

																			</Tooltip>

																		</div>

																	</Card>

																</Col>

															);
														}
													)}

												</Row>

											</div>
										)}

								</Col>


								{/* ==========================================
								    PREVIEW SIDEBAR
								========================================== */}

								{selectedFile && (

									<Col
										xs={24}
										lg={8}
									>

										<Card
											title={
												<span
													style={{
														fontWeight:
															600,
													}}
												>
													Просмотр чертежа
												</span>
											}
											extra={
												<Button
													type="text"
													shape="circle"
													icon={
														<CloseOutlined />
													}
													onClick={() =>
														setSelectedFile(
															null
														)
													}
												/>
											}
											style={{
												borderRadius:
													12,
												position:
													'sticky',
												top:
													24,
												boxShadow:
													'0 4px 12px rgba(0,0,0,0.05)',
												border:
													'1px solid #d9d9d9',
											}}
										>


											{/* PREVIEW */}

											<div
												style={{
													width:
														'100%',
													height:
														350,
													display:
														'flex',
													alignItems:
														'center',
													justifyContent:
														'center',
													background:
														'#fff',
													borderRadius:
														8,
													border:
														'1px solid #f0f0f0',
													padding:
														16,
													marginBottom:
														16,
													overflow:
														'hidden',
												}}
											>

												<img
													src={
														previewSrc
													}
													alt={
														selectedFile.name
													}
													style={{
														maxWidth:
															'100%',
														maxHeight:
															'100%',
														width:
															'100%',
														height:
															'100%',
														objectFit:
															'contain',
													}}
													onError={(
														e
													) => {
														message.error(
															'Ошибка загрузки превью SVG.'
														);

														e.currentTarget.style.display =
															'none';
													}}
												/>

											</div>


											<div
												style={{
													padding:
														'0 4px',
												}}
											>


												{/* FILE NAME */}

												<div
													style={{
														color:
															'#8c8c8c',
														fontSize:
															12,
														marginBottom:
															4,
													}}
												>
													Имя файла:
												</div>

												<div
													style={{
														fontWeight:
															600,
														fontSize:
															15,
														color:
															'#262626',
														wordBreak:
															'break-all',
														marginBottom:
															12,
													}}
												>
													{
														selectedFile.name
													}
												</div>


												{/* FILE URL */}

												<div
													style={{
														color:
															'#8c8c8c',
														fontSize:
															12,
														marginBottom:
															4,
													}}
												>
													Полный путь ссылки:
												</div>

												<div
													style={{
														fontWeight:
															500,
														color:
															'#1890ff',
														fontSize:
															13,
														wordBreak:
															'break-all',
														marginBottom:
															20,
													}}
												>
													{
														selectedFileSrc
													}
												</div>


												{/* FILE ACTIONS */}

												<Space
													style={{
														width:
															'100%',
														marginBottom:
															12,
													}}
													direction="vertical"
												>

													<Button
														block
														icon={
															<EditOutlined />
														}
														onClick={() => {

															const fileNameWithoutExtension =
																selectedFile.name.replace(
																	/\.[^/.]+$/,
																	''
																);

															setRenameTarget(
																{
																	type:
																		'file',
																	id:
																		selectedFile.id,
																	name:
																		selectedFile.name,
																	extension:
																		selectedFile.name.match(
																			/\.[^/.]+$/
																		)?.[0] ||
																		'',
																}
															);

															renameForm.setFieldsValue(
																{
																	newName:
																		fileNameWithoutExtension,
																}
															);

														}}
													>
														Переименовать файл
													</Button>


													<Popconfirm
														title="Удалить этот файл с сервера?"
														onConfirm={() =>
															handleDeleteFile(
																selectedFile.id
															)
														}
														okText="Да"
														cancelText="Нет"
													>

														<Button
															block
															danger
															icon={
																<DeleteOutlined />
															}
														>
															Удалить файл
														</Button>

													</Popconfirm>

												</Space>


												{/* CUT BUTTON */}

												<Button
													type="primary"
													danger
													block
													size="large"
													icon={
														<ScissorOutlined />
													}
													loading={
														isCutting
													}
													disabled={
														!cameoConnected ||
														!cameoCharacteristic
													}
													onClick={
														handleJustCut
													}
													style={{
														borderRadius:
															8,
														fontWeight:
															600,
														height:
															45,
													}}
												>
													{!cameoConnected
														? 'Сначала подключите Cameo'
														: !cameoCharacteristic
															? 'Выберите BLE characteristic'
															: 'Отправить на резку'}
												</Button>

											</div>

										</Card>

									</Col>

								)}

							</Row>

						)}

					</Spin>

				</Dragger>


				{/* =================================================
				    CREATE FOLDER MODAL
				================================================= */}

				<Modal
					title={`Создать папку внутри "${currentFolder.name}"`}
					open={
						isModalOpen
					}
					onOk={() =>
						form.submit()
					}
					onCancel={() => {
						setIsModalOpen(
							false
						);

						form.resetFields();
					}}
					confirmLoading={
						isCreating
					}
					okText="Создать"
					cancelText="Отмена"
					destroyOnClose
				>

					<Form
						form={form}
						layout="vertical"
						onFinish={
							handleCreateFolder
						}
						style={{
							marginTop:
								16,
						}}
					>

						<Form.Item
							name="name"
							label="Название папки"
							rules={[
								{
									required:
										true,
									message:
										'Введите название папки',
								},
							]}
						>

							<Input
								placeholder="Новая папка"
								autoFocus
								disabled={
									isCreating
								}
							/>

						</Form.Item>

					</Form>

				</Modal>


				{/* =================================================
				    RENAME MODAL
				================================================= */}

				<Modal
					title={
						renameTarget?.type ===
							'folder'
							? 'Переименовать папку'
							: 'Переименовать файл'
					}
					open={
						!!renameTarget
					}
					onOk={() =>
						renameForm.submit()
					}
					onCancel={() => {
						setRenameTarget(
							null
						);

						renameForm.resetFields();
					}}
					okText="Сохранить"
					cancelText="Отмена"
					destroyOnClose
				>

					<Form
						form={
							renameForm
						}
						layout="vertical"
						onFinish={
							handleRename
						}
						style={{
							marginTop:
								16,
						}}
					>

						<Form.Item
							name="newName"
							label="Новое название"
							rules={[
								{
									required:
										true,
									message:
										'Поле не может быть пустым',
								},
							]}
						>

							<Input
								autoFocus
							/>

						</Form.Item>

					</Form>

				</Modal>

			</Content>

		</Layout>
	);
}