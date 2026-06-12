import React, { useState, useMemo } from 'react';
import {
    Layout, Breadcrumb, Input, Button, Card, Row, Col,
    Modal, Form, message, Spin, Empty, Tooltip, Space, Popconfirm, Upload
} from 'antd';
import {
    FolderOutlined, FileOutlined, ArrowLeftOutlined,
    PlusOutlined, SyncOutlined, SearchOutlined, HomeOutlined, DeleteOutlined, UploadOutlined
} from '@ant-design/icons';
// Импортируем хуки из нашего единого fileApi
import {
    useGetFoldersQuery,
    useCreateFolderMutation,
    useSyncFoldersMutation,
    useDeleteFolderMutation,
    useUploadFileMutation
} from '../store/api/fileApi';

const { Header, Content } = Layout;

export default function FolderManager() {
    // RTK Query Хуки
    const { data: folders = [], isLoading: isFetchLoading } = useGetFoldersQuery();
    const [syncFolders, { isLoading: isSyncing }] = useSyncFoldersMutation();
    const [createFolder, { isLoading: isCreating }] = useCreateFolderMutation();
    const [deleteFolder] = useDeleteFolderMutation();
    const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation();

    // Навигационный стейт
    const [history, setHistory] = useState([{ id: null, name: 'Корневая папка' }]);
    const [searchQuery, setSearchQuery] = useState('');

    // Состояние модалки
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const currentFolder = useMemo(() => history[history.length - 1], [history]);

    // Хендлер загрузки файла
    const handleUpload = async (options) => {
        const { file, onSuccess, onError } = options;

        const formData = new FormData();
        formData.append('file', file); // Ключ, который ожидает бэкенд (обычно 'file' или 'files')

        // Если мы находимся внутри какой-то папки, передаем её ID
        if (currentFolder.id !== null) {
            formData.append('folderId', currentFolder.id);
        }

        try {
            await uploadFile(formData).unwrap();
            message.success(`Файл "${file.name}" успешно загружен`);
            onSuccess("ok"); // Уведомляем Ant Design, что загрузка прошла успешно
        } catch (err) {
            message.error(err?.data?.message || `Не удалось загрузить файл "${file.name}"`);
            onError(err); // Уведомляем Ant Design об ошибке
        }
    };

    // Хендлер синхронизации с диском
    const handleSync = async () => {
        try {
            await syncFolders().unwrap();
            message.success('Синхронизация папки disk успешно завершена');
        } catch {
            message.error('Не удалось синхронизировать диск');
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

    // Хендлер удаления папки
    const handleDeleteFolder = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteFolder(id).unwrap();
            message.success('Папка удалена');
        } catch {
            message.error('Не удалось удалить папку');
        }
    };

    // Навигация
    const handleBreadcrumbClick = (index) => {
        setHistory(history.slice(0, index + 1));
        setSearchQuery('');
    };

    const handleFolderClick = (folderId, folderName) => {
        setHistory([...history, { id: folderId, name: folderName }]);
        setSearchQuery('');
    };

    // Клиентская фильтрация и поиск на основе кэша RTK Query
    const { visibleFolders, visibleFiles } = useMemo(() => {
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const filteredFolders = folders.filter(f => f.name.toLowerCase().includes(query));

            const filteredFiles = [];
            folders.forEach(f => {
                if (f.files) {
                    f.files.forEach(file => {
                        if (file.name.toLowerCase().includes(query)) {
                            filteredFiles.push({ ...file, folderName: f.name });
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
            return {
                visibleFolders: activeData?.children || [],
                visibleFiles: activeData?.files || []
            };
        }
    }, [folders, currentFolder, searchQuery]);

    return (
        <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '0 24px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#141414' }}>
                    📂 Файловый менеджер
                </div>
                <Button
                    type="primary"
                    ghost
                    icon={<SyncOutlined spin={isSyncing} />}
                    onClick={handleSync}
                    disabled={isFetchLoading || isSyncing}
                >
                    {isSyncing ? 'Синхронизация...' : 'Синхронизировать диск'}
                </Button>
            </Header>

            <Content style={{ padding: '24px', maxWidth: '90vw', width: '100%', margin: '0 auto' }}>

                {/* Тулбар */}
                <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            placeholder="Поиск папок и файлов..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col>
                        <Space>
                            {history.length > 1 && !searchQuery && (
                                <Button icon={<ArrowLeftOutlined />} onClick={() => setHistory(history.slice(0, -1))}>Назад</Button>
                            )}

                            {/* Компонент Загрузки Файла */}
                            <Upload
                                customRequest={handleUpload}
                                showUploadList={false} // Скрываем дефолтный список AntD, так как файлы отображаются в карточках ниже
                                disabled={isUploading || isFetchLoading}
                            >
                                <Button
                                    icon={<UploadOutlined />}
                                    loading={isUploading}
                                    disabled={isFetchLoading}
                                >
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

                {/* Хлебные крошки */}
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

                {/* Индикатор глобального поиска */}
                {searchQuery && (
                    <div style={{ marginBottom: '15px', color: '#8c8c8c' }}>
                        Результаты глобального поиска по запросу: <strong>"{searchQuery}"</strong>
                    </div>
                )}

                <Spin spinning={isFetchLoading} size="large" tip="Чтение структуры папок...">
                    {visibleFolders.length === 0 && visibleFiles.length === 0 ? (
                        <Empty description="Папка пуста или ничего не найдено" style={{ marginTop: '60px' }} />
                    ) : (
                        <>
                            {/* Секция: ПАПКИ */}
                            {visibleFolders.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ marginBottom: '12px', color: '#595959' }}>Папки ({visibleFolders.length})</h3>
                                    <Row gutter={[16, 16]}>
                                        {visibleFolders.map((folder) => (
                                            <Col xs={12} sm={8} md={6} lg={4} key={folder.id}>
                                                <Card
                                                    hoverable
                                                    bodyStyle={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                                                    onClick={() => handleFolderClick(folder.id, folder.name)}
                                                    style={{ borderRadius: '8px', border: '1px solid #f0f0f0' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', width: '80%' }}>
                                                        <FolderOutlined style={{ fontSize: '28px', color: '#ffc069', flexShrink: 0 }} />
                                                        <Tooltip title={folder.name}>
                                                            <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {folder.name}
                                                            </span>
                                                        </Tooltip>
                                                    </div>

                                                    <Popconfirm
                                                        title="Удалить папку?"
                                                        description="Это удалит папку и всё её содержимое."
                                                        onConfirm={(e) => handleDeleteFolder(e, folder.id)}
                                                        onCancel={(e) => e.stopPropagation()}
                                                        okText="Да"
                                                        cancelText="Нет"
                                                    >
                                                        <Button
                                                            type="text"
                                                            danger
                                                            icon={<DeleteOutlined />}
                                                            onClick={(e) => e.stopPropagation()}
                                                            style={{ flexShrink: 0 }}
                                                        />
                                                    </Popconfirm>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}

                            {/* Секция: ФАЙЛЫ */}
                            {visibleFiles.length > 0 && (
                                <div>
                                    <h3 style={{ marginBottom: '12px', color: '#595959' }}>Файлы ({visibleFiles.length})</h3>
                                    <Row gutter={[16, 16]}>
                                        {visibleFiles.map((file) => (
                                            <Col xs={12} sm={8} md={6} lg={4} key={file.id}>
                                                <Card
                                                    hoverable
                                                    bodyStyle={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}
                                                    style={{ borderRadius: '8px', background: '#fafafa', borderColor: '#f0f0f0' }}
                                                >
                                                    <FileOutlined style={{ fontSize: '28px', color: '#40a9ff', flexShrink: 0 }} />
                                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        <Tooltip title={`Файл: ${file.name} ${file.folderName ? `(в папке ${file.folderName})` : ''}`}>
                                                            <span style={{ color: '#262626' }}>{file.name}</span>
                                                        </Tooltip>
                                                    </div>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            )}
                        </>
                    )}
                </Spin>

                {/* Модальное окно создания папки */}
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