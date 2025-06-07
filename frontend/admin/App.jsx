import React, { useState, useEffect } from 'react';
import { Upload, Image, FileText, Music, Film, Box, Plus, Edit, Trash2, Search, Menu, X, LogOut, Settings, ChevronRight } from 'lucide-react';

// Admin Dashboard with in-memory auth storage
export default function AdminDashboard() {
    const [authToken, setAuthToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeView, setActiveView] = useState('dashboard');
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState({
        totalCollections: 0,
        totalItems: 0,
        totalViews: 0,
        recentActivity: []
    });

    // API client with token from state
    const api = {
        baseUrl: '/api',

        async fetch(endpoint, options = {}) {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
                    ...options.headers
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }

            return response.json();
        }
    };

    useEffect(() => {
        // Check if already authenticated via cookie
        checkAuth();
    }, []);

    useEffect(() => {
        if (user) {
            loadDashboardData();
        }
    }, [user]);

    const checkAuth = async () => {
        try {
            const response = await api.fetch('/auth/check');
            if (response.authenticated) {
                setUser(response.user);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (userData, token) => {
        setAuthToken(token);
        setUser(userData);
    };

    const loadDashboardData = async () => {
        try {
            const [collectionsData, itemsData] = await Promise.all([
                api.fetch('/collections'),
                api.fetch('/items?limit=100')
            ]);

            setCollections(collectionsData.collections);
            setStats({
                totalCollections: collectionsData.pagination.total,
                totalItems: itemsData.pagination.total,
                totalViews: itemsData.items.reduce((sum, item) => sum + item.view_count, 0),
                recentActivity: itemsData.items.slice(0, 5)
            });
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        }
    };

    const handleLogout = async () => {
        try {
            await api.fetch('/auth/logout', { method: 'POST' });
            setAuthToken(null);
            setUser(null);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return <LoginForm onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-800 text-white transition-all duration-300`}>
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <h1 className={`font-bold text-xl ${sidebarOpen ? 'block' : 'hidden'}`}>
                            Recollect Admin
                        </h1>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-gray-400 hover:text-white"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                <nav className="mt-8">
                    <SidebarLink
                        icon={<Settings />}
                        label="Dashboard"
                        active={activeView === 'dashboard'}
                        onClick={() => setActiveView('dashboard')}
                        expanded={sidebarOpen}
                    />
                    <SidebarLink
                        icon={<Box />}
                        label="Collections"
                        active={activeView === 'collections'}
                        onClick={() => setActiveView('collections')}
                        expanded={sidebarOpen}
                    />
                    <SidebarLink
                        icon={<Image />}
                        label="Items"
                        active={activeView === 'items'}
                        onClick={() => setActiveView('items')}
                        expanded={sidebarOpen}
                    />
                    <SidebarLink
                        icon={<Upload />}
                        label="Upload"
                        active={activeView === 'upload'}
                        onClick={() => setActiveView('upload')}
                        expanded={sidebarOpen}
                    />
                </nav>

                <div className="absolute bottom-0 w-full p-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center text-gray-400 hover:text-white w-full"
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span className="ml-3">Logout</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm">
                    <div className="px-6 py-4">
                        <h2 className="text-2xl font-semibold text-gray-800">
                            {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                        </h2>
                    </div>
                </header>

                <main className="p-6">
                    {activeView === 'dashboard' && <DashboardView stats={stats} />}
                    {activeView === 'collections' && (
                        <CollectionsView
                            collections={collections}
                            onRefresh={loadDashboardData}
                            api={api}
                        />
                    )}
                    {activeView === 'items' && (
                        <ItemsView
                            collections={collections}
                            onRefresh={loadDashboardData}
                            api={api}
                        />
                    )}
                    {activeView === 'upload' && (
                        <UploadView
                            collections={collections}
                            onSuccess={loadDashboardData}
                            authToken={authToken}
                            api={api}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}

// Sidebar Link Component
function SidebarLink({ icon, label, active, onClick, expanded }) {
    return (
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors ${
                active ? 'bg-gray-700 text-white border-l-4 border-indigo-500' : ''
            }`}
        >
            {icon}
            {expanded && <span className="ml-3">{label}</span>}
        </a>
    );
}

// Dashboard View
function DashboardView({ stats }) {
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title="Total Collections"
                    value={stats.totalCollections}
                    icon={<Box className="text-blue-500" />}
                />
                <StatCard
                    title="Total Items"
                    value={stats.totalItems}
                    icon={<Image className="text-green-500" />}
                />
                <StatCard
                    title="Total Views"
                    value={stats.totalViews.toLocaleString()}
                    icon={<Search className="text-purple-500" />}
                />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {stats.recentActivity.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b">
                            <div className="flex items-center">
                                {getItemIcon(item.item_type)}
                                <div className="ml-3">
                                    <p className="font-medium">{item.title}</p>
                                    <p className="text-sm text-gray-500">{item.collection_title}</p>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500">
                                {item.view_count} views
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, icon }) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                {icon}
            </div>
        </div>
    );
}

// Collections View
function CollectionsView({ collections, onRefresh, api }) {
    const [showForm, setShowForm] = useState(false);
    const [editingCollection, setEditingCollection] = useState(null);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this collection?')) return;

        try {
            await api.fetch(`/collections/${id}`, { method: 'DELETE' });
            onRefresh();
        } catch (err) {
            alert('Failed to delete collection: ' + err.message);
        }
    };

    return (
        <div>
            <div className="mb-6">
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
                >
                    <Plus size={20} className="mr-2" />
                    New Collection
                </button>
            </div>

            {showForm && (
                <CollectionForm
                    collection={editingCollection}
                    onClose={() => {
                        setShowForm(false);
                        setEditingCollection(null);
                    }}
                    onSuccess={() => {
                        setShowForm(false);
                        setEditingCollection(null);
                        onRefresh();
                    }}
                    api={api}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map(collection => (
                    <div key={collection.id} className="bg-white rounded-lg shadow overflow-hidden">
                        {collection.thumbnail_url && (
                            <img
                                src={collection.thumbnail_url}
                                alt={collection.title}
                                className="w-full h-48 object-cover"
                            />
                        )}
                        <div className="p-4">
                            <h3 className="font-semibold text-lg mb-2">{collection.title}</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                {collection.description || 'No description'}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>{collection.item_count || 0} items</span>
                                <span>{collection.is_public ? 'Public' : 'Private'}</span>
                            </div>
                            <div className="mt-4 flex space-x-2">
                                <button
                                    onClick={() => {
                                        setEditingCollection(collection);
                                        setShowForm(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(collection.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Collection Form
function CollectionForm({ collection, onClose, onSuccess, api }) {
    const [formData, setFormData] = useState({
        title: collection?.title || '',
        description: collection?.description || '',
        is_public: collection?.is_public ?? true
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!formData.title) return;
        setLoading(true);

        try {
            if (collection) {
                await api.fetch(`/collections/${collection.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                await api.fetch('/collections', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }
            onSuccess();
        } catch (err) {
            alert('Failed to save collection: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold mb-4">
                    {collection ? 'Edit Collection' : 'New Collection'}
                </h3>
                <div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows="3"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_public}
                                onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                                className="mr-2"
                            />
                            <span className="text-sm">Make this collection public</span>
                        </label>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !formData.title}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Items View
function ItemsView({ collections, onRefresh, api }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCollection, setSelectedCollection] = useState('');
    const [selectedType, setSelectedType] = useState('');

    useEffect(() => {
        loadItems();
    }, [selectedCollection, selectedType]);

    const loadItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCollection) params.set('collection', selectedCollection);
            if (selectedType) params.set('type', selectedType);
            params.set('limit', '50');

            const response = await api.fetch(`/items?${params}`);
            setItems(response.items);
        } catch (err) {
            console.error('Failed to load items:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            await api.fetch(`/items/${id}`, { method: 'DELETE' });
            loadItems();
            onRefresh();
        } catch (err) {
            alert('Failed to delete item: ' + err.message);
        }
    };

    return (
        <div>
            <div className="mb-6 flex space-x-4">
                <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Collections</option>
                    {collections.map(col => (
                        <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                </select>

                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">All Types</option>
                    <option value="image">Images</option>
                    <option value="document">Documents</option>
                    <option value="audio">Audio</option>
                    <option value="video">Video</option>
                    <option value="3d">3D Objects</option>
                </select>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Loading items...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
                            {item.thumbnail_url ? (
                                <img
                                    src={item.thumbnail_url}
                                    alt={item.title}
                                    className="w-full h-40 object-cover"
                                />
                            ) : (
                                <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                                    {getItemIcon(item.item_type, 'text-4xl text-gray-400')}
                                </div>
                            )}
                            <div className="p-3">
                                <h4 className="font-medium truncate">{item.title}</h4>
                                <p className="text-sm text-gray-500 truncate">{item.collection_title}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">{item.view_count} views</span>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Upload View
function UploadView({ collections, onSuccess, authToken, api }) {
    const [selectedCollection, setSelectedCollection] = useState('');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});

    const handleFileSelect = (e) => {
        const newFiles = Array.from(e.target.files);
        setFiles([...files, ...newFiles]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const newFiles = Array.from(e.dataTransfer.files);
        setFiles([...files, ...newFiles]);
    };

    const handleUpload = async () => {
        if (!selectedCollection) {
            alert('Please select a collection');
            return;
        }

        if (files.length === 0) {
            alert('Please select files to upload');
            return;
        }

        setUploading(true);

        for (const file of files) {
            try {
                // Upload file
                const formData = new FormData();
                formData.append('file', file);
                formData.append('thumbnail', 'true');

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: formData
                });

                if (!uploadResponse.ok) {
                    throw new Error('Upload failed');
                }

                const uploadResult = await uploadResponse.json();

                // Create item
                await api.fetch('/items', {
                    method: 'POST',
                    body: JSON.stringify({
                        collection_id: parseInt(selectedCollection),
                        title: file.name.replace(/\.[^/.]+$/, ''),
                        item_type: getItemTypeFromMime(file.type),
                        media_url: uploadResult.media_url,
                        thumbnail_url: uploadResult.thumbnail_url,
                        is_public: true
                    })
                });

                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: 100
                }));
            } catch (err) {
                console.error('Upload failed for', file.name, err);
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: -1
                }));
            }
        }

        setUploading(false);
        onSuccess();
        setFiles([]);
        setUploadProgress({});
    };

    return (
        <div>
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Collection</label>
                <select
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Choose a collection...</option>
                    {collections.map(col => (
                        <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                </select>
            </div>

            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
            >
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                    Drag and drop files here, or click to select
                </p>
                <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                    accept="image/*,audio/*,video/*,.pdf,.glb,.gltf,.obj,.stl"
                />
                <label
                    htmlFor="file-input"
                    className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                    Select Files
                </label>
            </div>

            {files.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-semibold mb-4">Selected Files ({files.length})</h3>
                    <div className="space-y-2">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                <div className="flex items-center">
                                    {getItemIcon(getItemTypeFromMime(file.type))}
                                    <span className="ml-3">{file.name}</span>
                                    <span className="ml-2 text-sm text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                                </div>
                                {uploadProgress[file.name] !== undefined && (
                                    <span className={uploadProgress[file.name] === 100 ? 'text-green-600' : 'text-red-600'}>
                    {uploadProgress[file.name] === 100 ? '✓' : '✗'}
                  </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={uploading || !selectedCollection}
                        className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : `Upload ${files.length} Files`}
                    </button>
                </div>
            )}
        </div>
    );
}

// Utility functions
function getItemIcon(type, className = '') {
    const icons = {
        image: <Image className={className} />,
        document: <FileText className={className} />,
        audio: <Music className={className} />,
        video: <Film className={className} />,
        '3d': <Box className={className} />
    };
    return icons[type] || <FileText className={className} />;
}

function getItemTypeFromMime(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'document';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('model/') || mimeType.includes('gltf') || mimeType.includes('glb')) {
        return '3d';
    }
    return 'document';
}