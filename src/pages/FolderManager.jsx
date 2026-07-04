import React, { useState, useMemo } from 'react';
import {
    Layout, Breadcrumb, Input, Button, Card, Row, Col,
    Modal, Form, message, Spin, Empty, Tooltip, Space, Upload
} from 'antd';
import {
    FolderOutlined, FileOutlined, ArrowLeftOutlined,
    PlusOutlined, SearchOutlined, HomeOutlined,
    UploadOutlined, CloseOutlined, ScissorOutlined
} from '@ant-design/icons';

// Импортируем хуки из fileApi
import {
    useGetFoldersQuery,
    useCreateFolderMutation,
    useUploadFileMutation
} from '../store/api/fileApi';

// Импортируем хуки из orderApi
import {
    useCreateSimpleOrderMutation // Предполагаем, что ты добавил туда или используешь метод для /simple
} from '../store/api/orderApi';

const { Content } = Layout;

const buildFolderPath = (folderId, allFolders) => {
    if (!folderId) return '';
    const pathSegments = [];
    let currentId = folderId;

    for (let depth = 0; depth < 10; depth++) {
        const currentFolder = allFolders.find(f => f.id === currentId);
        if (!currentFolder) break;

        pathSegments.unshift(currentFolder.name);

        const parentFolder = allFolders.find(f => f.children?.some(child => child.id === currentId));
        if (parentFolder) {
            currentId = parentFolder.id;
        } else {
            break;
        }
    }

    return pathSegments.join('/');
};

export default function FolderManager() {
    const { data: folders = [], isLoading: isFetchLoading } = useGetFoldersQuery();
    const [createFolder, { isLoading: isCreating }] = useCreateFolderMutation();
    const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();

    // Мутация для быстрого заказа
    const [createOrder, { isLoading: isOrderCreating }] = useCreateSimpleOrderMutation();

    const [history, setHistory] = useState([{ id: null, name: 'Корневая папка' }]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCuttingLoading, setIsCuttingLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [form] = Form.useForm();
    const currentFolder = useMemo(() => history[history.length - 1], [history]);

    // Хендлер загрузки файла
    const handleUpload = async (options) => {
        const { file, onSuccess, onError } = options;
        const formData = new FormData();
        formData.append('file', file);

        if (currentFolder.id !== null) {
            formData.append('folderId', currentFolder.id);
        }

        try {
            await uploadFile(formData).unwrap();
            message.success(`Файл "${file.name}" успешно загружен`);
            onSuccess("ok");
        } catch (err) {
            message.error(err?.data?.message || `Не удалось загрузить файл "${file.name}"`);
            onError(err);
        }
    };

    // Хендлер создания папки
    const handleCreateFolder = async (values) => {
        try {
            await createFolder({
                name: values.name,
                parentId: currentFolder.id,
            }).unwrap();
            message.success(`Папка "${values.name}" создана`);
            setIsModalOpen(false);
            form.resetFields();
        } catch (err) {
            message.error(err?.data?.message || 'Ошибка при создании папки');
        }
    };

    const handleBreadcrumbClick = (index) => {
        setHistory(history.slice(0, index + 1));
        setSearchQuery('');
        setSelectedFile(null);
    };

    const handleFolderClick = (folderId, folderName) => {
        setHistory([...history, { id: folderId, name: folderName }]);
        setSearchQuery('');
        setSelectedFile(null);
    };

    const { visibleFolders, visibleFiles } = useMemo(() => {
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(query));

            const filteredFiles = [];
            folders.forEach(f => {
                if (f.files) {
                    f.files.forEach(file => {
                        if (file.name.toLowerCase().includes(query) && !file.name.toLowerCase().endsWith('.plt')) {
                            const fullPath = buildFolderPath(f.id, folders);
                            filteredFiles.push({
                                ...file,
                                folderName: f.name,
                                folderPath: fullPath
                            });
                        }
                    });
                }
            });
            return { visibleFolders: filteredFolders, visibleFiles: filteredFiles };
        }

        if (currentFolder.id === null) {
            const allChildrenIds = new Set(
                folders.flatMap(f => f.children?.map(child => child.id) || [])
            );
            const rootFolders = folders.filter(f => !allChildrenIds.has(f.id));
            return { visibleFolders: rootFolders, visibleFiles: [] };
        } else {
            const activeData = folders.find(f => f.id === currentFolder.id);
            const fullPath = buildFolderPath(currentFolder.id, folders);

            const files = (activeData?.files || [])
                .filter(file => !file.name.toLowerCase().endsWith('.plt'))
                .map(file => ({
                    ...file,
                    folderName: activeData?.name,
                    folderPath: fullPath
                }));

            return {
                visibleFolders: activeData?.children || [],
                visibleFiles: files
            };
        }
    }, [folders, currentFolder, searchQuery]);

    const selectedFileSrc = useMemo(() => {
        if (!selectedFile) return '';
        const host = 'https://ocleon.333.kg/disk';
        const folderPath = selectedFile.folderPath ? `/${selectedFile.folderPath}` : '';
        return `${host}${folderPath}/${selectedFile.name}`;
    }, [selectedFile]);

    /**
     * МАКСИМАЛЬНО ПРОСТОЙ ХЕНДЛЕР: Создание пустой резки в CRM + отправка на станок
     */
    const handleJustCut = async () => {
        if (!selectedFile) return;

        setIsCuttingLoading(true);
        try {
            // 1. Создаем быстрый заказ в CRM (стучимся в твой новый @Post("simple"))
            // Примечание: Убедись, что в твоем RTK Query методе (createOrder) урл изменен на /simple, 
            // либо сделай для него отдельный хук, например useCreateSimpleOrderMutation
            await createOrder({ fileId: selectedFile.id }).unwrap();
            message.success('Заказ (черновик) зарегистрирован в CRM');

            // 2. Скачиваем .plt файл
            const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'));
            const pltFileName = `${baseName}.plt`;

            const host = 'https://ocleon.333.kg/disk';
            const folderPath = selectedFile.folderPath ? `/${selectedFile.folderPath}` : '';
            const pltFileUrl = `${host}${folderPath}/${pltFileName}`;

            const response = await fetch(pltFileUrl);
            if (!response.ok) {
                throw new Error(`Не удалось получить файл .plt с сервера. Статус: ${response.status}`);
            }
            const fileBlob = await response.blob();

            // 3. Отправляем FormData на локальный станок
            const formdata = new FormData();
            formdata.append("file", fileBlob, pltFileName);

            const localResponse = await fetch("http://localhost:5000/cut", {
                method: "POST",
                body: formdata,
                redirect: "follow"
            });

            if (!localResponse.ok) {
                throw new Error('Локальный станок отклонил файл резки');
            }

            message.success(`Задание "${pltFileName}" успешно отправлено на станок!`);
        } catch (error) {
            console.error(error);
            message.error(error?.data?.message || error.message || 'Ошибка при мгновенном запуске резки');
        } finally {
            setIsCuttingLoading(false);
        }
    };

    return (
        <Layout style={{ minHeight: 'calc(100vh - 140px)', background: '#f5f5f5' }}>
            <Content style={{ maxWidth: '1900px', width: 'calc(100% - 24px)', margin: '0 auto' }}>

                {/* ТУЛБАР */}
                <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            placeholder="Поиск папок и файлов..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setSelectedFile(null);
                            }}
                            allowClear
                        />
                    </Col>
                    <Col>
                        <Space>
                            {history.length > 1 && !searchQuery && (
                                <Button icon={<ArrowLeftOutlined />} onClick={() => { setHistory(history.slice(0, -1)); setSelectedFile(null); }}>Назад</Button>
                            )}

                            <Upload
                                customRequest={handleUpload}
                                showUploadList={false}
                                disabled={isUploading || isFetchLoading}
                            >
                                <Button icon={<UploadOutlined />} loading={isUploading} disabled={isFetchLoading}>
                                    Загрузить файл
                                </Button>
                            </Upload>

                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => setIsModalOpen(true)}
                                disabled={isFetchLoading}
                            >
                                Создать папку
                            </Button>
                        </Space>
                    </Col>
                </Row>

                {/* ХЛЕБНЫЕ КРОШКИ */}
                {!searchQuery && (
                    <Breadcrumb style={{ marginBottom: '20px', fontSize: '14px' }}>
                        {history.map((item, index) => (
                            <Breadcrumb.Item
                                key={index}
                                style={{ cursor: index < history.length - 1 ? 'pointer' : 'default' }}
                                onClick={() => index < history.length - 1 && handleBreadcrumbClick(index)}
                            >
                                {index === 0 ? <><HomeOutlined /> {item.name}</> : item.name}
                            </Breadcrumb.Item>
                        ))}
                    </Breadcrumb>
                )}

                <Spin spinning={isFetchLoading} size="large" tip="Чтение структуры папок...">
                    {visibleFolders.length === 0 && visibleFiles.length === 0 ? (
                        <Empty description="Папка пуста или ничего не найдено" style={{ marginTop: '60px' }} />
                    ) : (
                        <Row gutter={[24, 24]}>
                            {/* СЕТКА ЭЛЕМЕНТОВ */}
                            <Col xs={24} lg={selectedFile ? 16 : 24} style={{ transition: 'all 0.3s' }}>
                                {/* ПАПКИ */}
                                {visibleFolders.length > 0 && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <h3 style={{ marginBottom: '12px', color: '#595959' }}>Папки ({visibleFolders.length})</h3>
                                        <Row gutter={[16, 16]}>
                                            {visibleFolders.map((folder) => (
                                                <Col xs={12} sm={12} md={8} lg={selectedFile ? 8 : 6} key={folder.id}>
                                                    <Card
                                                        hoverable
                                                        bodyStyle={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                        onClick={() => handleFolderClick(folder.id, folder.name)}
                                                        style={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', width: '100%' }}>
                                                            <FolderOutlined style={{ fontSize: '28px', color: '#ffc069', flexShrink: 0 }} />
                                                            <Tooltip title={folder.name}>
                                                                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {folder.name}
                                                                </span>
                                                            </Tooltip>
                                                        </div>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                )}

                                {/* ФАЙЛЫ */}
                                {visibleFiles.length > 0 && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <h3 style={{ marginBottom: '12px', color: '#595959' }}>Файлы ({visibleFiles.length})</h3>
                                        <Row gutter={[16, 16]}>
                                            {visibleFiles.map((file) => {
                                                const isCurrentSelected = selectedFile?.id === file.id;
                                                return (
                                                    <Col xs={12} sm={12} md={8} lg={selectedFile ? 8 : 6} key={file.id}>
                                                        <Card
                                                            hoverable
                                                            bodyStyle={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}
                                                            onClick={() => setSelectedFile(file)}
                                                            style={{
                                                                borderRadius: '8px',
                                                                background: isCurrentSelected ? '#e6f7ff' : '#fafafa',
                                                                borderColor: isCurrentSelected ? '#1890ff' : '#f0f0f0',
                                                                boxShadow: isCurrentSelected ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <FileOutlined style={{ fontSize: '26px', color: '#40a9ff', flexShrink: 0 }} />
                                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                                                <Tooltip title={`Файл: ${file.name}`}>
                                                                    <span style={{ color: '#262626', fontWeight: 500 }}>{file.name}</span>
                                                                </Tooltip>
                                                            </div>
                                                        </Card>
                                                    </Col>
                                                );
                                            })}
                                        </Row>
                                    </div>
                                )}
                            </Col>

                            {/* САЙДБАР ПРЕДПРОСМОТРА С ПРЯМОЙ КНОПКОЙ НА СТАНOК */}
                            {selectedFile && (
                                <Col xs={24} lg={8}>
                                    <Card
                                        title={<span style={{ fontWeight: 600 }}>Просмотр чертежа</span>}
                                        extra={<Button type="text" shape="circle" icon={<CloseOutlined />} onClick={() => setSelectedFile(null)} />}
                                        style={{
                                            borderRadius: '12px',
                                            position: 'sticky',
                                            top: '24px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            border: '1px solid #d9d9d9'
                                        }}
                                    >
                                        <div style={{
                                            width: '100%', height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: '#fff', borderRadius: '8px', border: '1px solid #f0f0f0', padding: '16px', marginBottom: '16px', overflow: 'hidden'
                                        }}>
                                            <img
                                                src={selectedFileSrc}
                                                alt={selectedFile.name}
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                onError={(e) => {
                                                    message.error('Ошибка загрузки превью SVG.');
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        </div>

                                        <div style={{ padding: '0 4px' }}>
                                            <div style={{ color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>Имя файла:</div>
                                            <div style={{ fontWeight: 600, fontSize: '15px', color: '#262626', wordBreak: 'break-all', marginBottom: '12px' }}>
                                                {selectedFile.name}
                                            </div>

                                            <div style={{ color: '#8c8c8c', fontSize: '12px', marginBottom: '4px' }}>Полный путь ссылки:</div>
                                            <div style={{ fontWeight: 500, color: '#1890ff', fontSize: '13px', wordBreak: 'break-all', marginBottom: '20px' }}>
                                                {selectedFileSrc}
                                            </div>

                                            {/* Прямой запуск резки в один клик */}
                                            <Button
                                                type="primary"
                                                danger
                                                block
                                                size="large"
                                                icon={<ScissorOutlined />}
                                                loading={isCuttingLoading || isOrderCreating}
                                                onClick={handleJustCut}
                                                style={{ borderRadius: '8px', fontWeight: 600, height: '45px' }}
                                            >
                                                Отправить на резку
                                            </Button>
                                        </div>
                                    </Card>
                                </Col>
                            )}
                        </Row>
                    )}
                </Spin>

                {/* Модалка создания папки */}
                <Modal
                    title={`Создать папку внутри "${currentFolder.name}"`}
                    open={isModalOpen}
                    onOk={() => form.submit()}
                    onCancel={() => { setIsModalOpen(false); form.resetFields(); }}
                    confirmLoading={isCreating}
                    okText="Создать"
                    cancelText="Отмена"
                    destroyOnClose
                >
                    <Form form={form} layout="vertical" onFinish={handleCreateFolder} style={{ marginTop: '16px' }}>
                        <Form.Item
                            name="name"
                            label="Название папки"
                            rules={[{ required: true, message: 'Введите название папки' }]}
                        >
                            <Input placeholder="Новая папка" autoFocus disabled={isCreating} />
                        </Form.Item>
                    </Form>
                </Modal>

            </Content>
        </Layout>
    );
}