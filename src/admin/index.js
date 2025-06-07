export function renderAdminDashboard() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Recollect OSS</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/lucide@0.263.1/dist/lucide.css">
</head>
<body class="bg-gray-100">
    <div id="app">
        <!-- Login Form (shown by default) -->
        <div id="login-view" class="min-h-screen flex items-center justify-center bg-gray-50">
            <div class="max-w-md w-full space-y-8 p-8">
                <div>
                    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Admin Login
                    </h2>
                </div>
                <div class="mt-8 space-y-6">
                    <div id="login-error" class="hidden bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded"></div>
                    <div class="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input id="email" type="email" required 
                                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                                placeholder="Email address">
                        </div>
                        <div>
                            <input id="password" type="password" required 
                                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" 
                                placeholder="Password">
                        </div>
                    </div>
                    <div>
                        <button onclick="login()" 
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Sign in
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Admin Dashboard (hidden by default) -->
        <div id="dashboard-view" class="hidden">
            <!-- Top Navigation -->
            <nav class="bg-gray-800 text-white">
                <div class="px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center justify-between h-16">
                        <div class="flex items-center">
                            <h1 class="text-xl font-semibold">Recollect Admin</h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span id="user-email" class="text-sm"></span>
                            <button onclick="logout()" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div class="flex h-screen pt-16">
                <!-- Sidebar -->
                <div class="w-64 bg-gray-800 text-white -mt-16 pt-16">
                    <nav class="mt-5">
                        <a href="#" onclick="showView('dashboard')" class="menu-item group flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white">
                            <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Dashboard
                        </a>
                        <a href="#" onclick="showView('collections')" class="menu-item group flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white">
                            <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Collections
                        </a>
                        <a href="#" onclick="showView('items')" class="menu-item group flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white">
                            <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Items
                        </a>
                        <a href="#" onclick="showView('upload')" class="menu-item group flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white">
                            <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload
                        </a>
                    </nav>
                </div>

                <!-- Main Content -->
                <div class="flex-1 overflow-auto">
                    <main class="p-6">
                        <!-- Dashboard View -->
                        <div id="dashboard-content" class="view-content">
                            <h2 class="text-2xl font-semibold mb-6">Dashboard</h2>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div class="bg-white rounded-lg shadow p-6">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-gray-500">Total Collections</p>
                                            <p id="total-collections" class="text-2xl font-bold mt-1">0</p>
                                        </div>
                                        <div class="text-blue-500">
                                            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-white rounded-lg shadow p-6">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-gray-500">Total Items</p>
                                            <p id="total-items" class="text-2xl font-bold mt-1">0</p>
                                        </div>
                                        <div class="text-green-500">
                                            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-white rounded-lg shadow p-6">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm text-gray-500">Total Views</p>
                                            <p id="total-views" class="text-2xl font-bold mt-1">0</p>
                                        </div>
                                        <div class="text-purple-500">
                                            <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Collections View -->
                        <div id="collections-content" class="view-content hidden">
                            <div class="flex justify-between items-center mb-6">
                                <h2 class="text-2xl font-semibold">Collections</h2>
                                <button onclick="showCollectionForm()" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                                    New Collection
                                </button>
                            </div>
                            <div id="collections-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <!-- Collections will be loaded here -->
                            </div>
                        </div>

                        <!-- Items View -->
                        <div id="items-content" class="view-content hidden">
                            <h2 class="text-2xl font-semibold mb-6">Items</h2>
                            <div id="items-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <!-- Items will be loaded here -->
                            </div>
                        </div>

                        <!-- Upload View -->
                        <div id="upload-content" class="view-content hidden">
                            <h2 class="text-2xl font-semibold mb-6">Upload Files</h2>
                            <div class="bg-white rounded-lg shadow p-6">
                                <div class="mb-4">
                                    <label class="block text-sm font-medium mb-2">Select Collection</label>
                                    <select id="upload-collection" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Choose a collection...</option>
                                    </select>
                                </div>
                                <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p class="mt-2 text-gray-600">Drag and drop files here, or click to select</p>
                                    <input type="file" id="file-input" multiple class="hidden" accept="image/*,audio/*,video/*,.pdf,.glb,.gltf">
                                    <button onclick="document.getElementById('file-input').click()" 
                                        class="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                                        Select Files
                                    </button>
                                </div>
                                <div id="file-list" class="mt-4 space-y-2"></div>
                                <button id="upload-btn" onclick="uploadFiles()" class="hidden mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                                    Upload Files
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>

        <!-- Collection Form Modal -->
        <div id="collection-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-semibold mb-4">New Collection</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Title</label>
                        <input type="text" id="collection-title" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Description</label>
                        <textarea id="collection-description" rows="3" class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                    </div>
                    <div>
                        <label class="flex items-center">
                            <input type="checkbox" id="collection-public" checked class="mr-2">
                            <span class="text-sm">Make this collection public</span>
                        </label>
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button onclick="hideCollectionForm()" class="px-4 py-2 text-gray-600 hover:text-gray-800">
                        Cancel
                    </button>
                    <button onclick="saveCollection()" class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Save
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Global state
        let authToken = null;
        let currentUser = null;
        let collections = [];
        let selectedFiles = [];

        // Check authentication on load
        window.addEventListener('load', async () => {
            const response = await fetch('/api/auth/check');
            const data = await response.json();
            
            if (data.authenticated) {
                currentUser = data.user;
                showDashboard();
            }
        });

        // Login function
        async function login() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('login-error');
            
            if (!email || !password) {
                errorEl.textContent = 'Please enter email and password';
                errorEl.classList.remove('hidden');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    authToken = data.token;
                    currentUser = data.user;
                    showDashboard();
                } else {
                    errorEl.textContent = data.error || 'Login failed';
                    errorEl.classList.remove('hidden');
                }
            } catch (err) {
                errorEl.textContent = 'Login failed: ' + err.message;
                errorEl.classList.remove('hidden');
            }
        }

        // Logout function
        async function logout() {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });
            } catch (err) {
                console.error('Logout error:', err);
            }
            
            authToken = null;
            currentUser = null;
            document.getElementById('login-view').classList.remove('hidden');
            document.getElementById('dashboard-view').classList.add('hidden');
        }

        // Show dashboard
        function showDashboard() {
            document.getElementById('login-view').classList.add('hidden');
            document.getElementById('dashboard-view').classList.remove('hidden');
            document.getElementById('user-email').textContent = currentUser.email;
            
            loadDashboardData();
            showView('dashboard');
        }

        // Show different views
        function showView(view) {
            // Hide all views
            document.querySelectorAll('.view-content').forEach(el => el.classList.add('hidden'));
            
            // Show selected view
            document.getElementById(view + '-content').classList.remove('hidden');
            
            // Update menu
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('bg-gray-700'));
            event.target.closest('.menu-item').classList.add('bg-gray-700');
            
            // Load data for view
            switch (view) {
                case 'dashboard':
                    loadDashboardData();
                    break;
                case 'collections':
                    loadCollections();
                    break;
                case 'items':
                    loadItems();
                    break;
                case 'upload':
                    loadUploadView();
                    break;
            }
        }

        // Load dashboard data
        async function loadDashboardData() {
            try {
                const [collectionsRes, itemsRes] = await Promise.all([
                    fetch('/api/collections', {
                        headers: { 'Authorization': 'Bearer ' + authToken }
                    }),
                    fetch('/api/items?limit=100', {
                        headers: { 'Authorization': 'Bearer ' + authToken }
                    })
                ]);
                
                const collectionsData = await collectionsRes.json();
                const itemsData = await itemsRes.json();
                
                document.getElementById('total-collections').textContent = collectionsData.pagination.total;
                document.getElementById('total-items').textContent = itemsData.pagination.total;
                
                const totalViews = itemsData.items.reduce((sum, item) => sum + item.view_count, 0);
                document.getElementById('total-views').textContent = totalViews.toLocaleString();
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
            }
        }

        // Load collections
        async function loadCollections() {
            try {
                const response = await fetch('/api/collections', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });
                const data = await response.json();
                collections = data.collections;
                
                const listEl = document.getElementById('collections-list');
                listEl.innerHTML = collections.map(collection => `
        <div class="bg-white rounded-lg shadow overflow-hidden">
        ${collection.thumbnail_url ?
        `<img src="${collection.thumbnail_url}" alt="${collection.title}" class="w-full h-48 object-cover">` :
        '<div class="w-full h-48 bg-gray-200 flex items-center justify-center"><span class="text-4xl text-gray-400">📁</span></div>'
    }
    <div class="p-4">
        <h3 class="font-semibold text-lg mb-2">${collection.title}</h3>
        <p class="text-gray-600 text-sm mb-4">${collection.description || 'No description'}</p>
        <div class="flex items-center justify-between text-sm text-gray-500">
            <span>${collection.item_count || 0} items</span>
            <span>${collection.is_public ? 'Public' : 'Private'}</span>
        </div>
        <div class="mt-4 flex space-x-2">
            <button onclick="deleteCollection(${collection.id})" class="text-red-600 hover:text-red-800">
                Delete
            </button>
        </div>
    </div>
</div>
    `).join('');
            } catch (err) {
                console.error('Failed to load collections:', err);
            }
        }

        // Load items
        async function loadItems() {
            try {
                const response = await fetch('/api/items?limit=50', {
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });
                const data = await response.json();
                
                const listEl = document.getElementById('items-list');
                listEl.innerHTML = data.items.map(item => `
    <div class="bg-white rounded-lg shadow overflow-hidden">
        ${item.thumbnail_url ?
        `<img src="${item.thumbnail_url}" alt="${item.title}" class="w-full h-40 object-cover">` :
        '<div class="w-full h-40 bg-gray-200 flex items-center justify-center"><span class="text-3xl text-gray-400">' + getItemIcon(item.item_type) + '</span></div>'
    }
    <div class="p-3">
        <h4 class="font-medium truncate">${item.title}</h4>
        <p class="text-sm text-gray-500 truncate">${item.collection_title}</p>
        <div class="mt-2 flex items-center justify-between">
            <span class="text-xs text-gray-500">${item.view_count} views</span>
            <button onclick="deleteItem(${item.id})" class="text-red-600 hover:text-red-800 text-sm">
                Delete
            </button>
        </div>
    </div>
</div>
    `).join('');
            } catch (err) {
                console.error('Failed to load items:', err);
            }
        }

        // Load upload view
        async function loadUploadView() {
            await loadCollections();
            
            const selectEl = document.getElementById('upload-collection');
            selectEl.innerHTML = '<option value="">Choose a collection...</option>' +
                collections.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }

        // Collection form functions
        function showCollectionForm() {
            document.getElementById('collection-modal').classList.remove('hidden');
        }

        function hideCollectionForm() {
            document.getElementById('collection-modal').classList.add('hidden');
            document.getElementById('collection-title').value = '';
            document.getElementById('collection-description').value = '';
            document.getElementById('collection-public').checked = true;
        }

        async function saveCollection() {
            const title = document.getElementById('collection-title').value;
            const description = document.getElementById('collection-description').value;
            const isPublic = document.getElementById('collection-public').checked;
            
            if (!title) {
                alert('Title is required');
                return;
            }
            
            try {
                const response = await fetch('/api/collections', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + authToken
                    },
                    body: JSON.stringify({
                        title,
                        description,
                        is_public: isPublic
                    })
                });
                
                if (response.ok) {
                    hideCollectionForm();
                    loadCollections();
                } else {
                    const error = await response.json();
                    alert('Failed to create collection: ' + error.error);
                }
            } catch (err) {
                alert('Failed to create collection: ' + err.message);
            }
        }

        // Delete functions
        async function deleteCollection(id) {
            if (!confirm('Are you sure you want to delete this collection?')) return;
            
            try {
                const response = await fetch('/api/collections/' + id, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });
                
                if (response.ok) {
                    loadCollections();
                    loadDashboardData();
                } else {
                    alert('Failed to delete collection');
                }
            } catch (err) {
                alert('Failed to delete collection: ' + err.message);
            }
        }

        async function deleteItem(id) {
            if (!confirm('Are you sure you want to delete this item?')) return;
            
            try {
                const response = await fetch('/api/items/' + id, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + authToken }
                });
                
                if (response.ok) {
                    loadItems();
                    loadDashboardData();
                } else {
                    alert('Failed to delete item');
                }
            } catch (err) {
                alert('Failed to delete item: ' + err.message);
            }
        }

        // File upload
        document.getElementById('file-input').addEventListener('change', (e) => {
            selectedFiles = Array.from(e.target.files);
            displaySelectedFiles();
        });

        function displaySelectedFiles() {
            const listEl = document.getElementById('file-list');
            const uploadBtn = document.getElementById('upload-btn');
            
            if (selectedFiles.length === 0) {
                listEl.innerHTML = '';
                uploadBtn.classList.add('hidden');
                return;
            }
            
            listEl.innerHTML = selectedFiles.map((file, i) => `
    <div class="flex items-center justify-between bg-gray-50 p-3 rounded">
        <div class="flex items-center">
        <span class="text-2xl mr-3">${getItemIcon(getItemType(file.type))}</span>
    <div>
        <p class="font-medium">${file.name}</p>
        <p class="text-sm text-gray-500">${(file.size / 1024 / 1024).toFixed(2)} MB</p>
    </div>
</div>
    <button onclick="removeFile(${i})" class="text-red-600 hover:text-red-800">Remove</button>
</div>
    `).join('');
            
            uploadBtn.classList.remove('hidden');
        }

        function removeFile(index) {
            selectedFiles.splice(index, 1);
            displaySelectedFiles();
        }

        async function uploadFiles() {
            const collectionId = document.getElementById('upload-collection').value;
            if (!collectionId) {
                alert('Please select a collection');
                return;
            }
            
            const uploadBtn = document.getElementById('upload-btn');
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Uploading...';
            
            for (const file of selectedFiles) {
                try {
                    // Upload file
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('thumbnail', 'true');
                    
                    const uploadResponse = await fetch('/api/upload', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + authToken },
                        body: formData
                    });
                    
                    if (!uploadResponse.ok) {
                        throw new Error('Upload failed');
                    }
                    
                    const uploadResult = await uploadResponse.json();
                    
                    // Create item
                    await fetch('/api/items', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + authToken
                        },
                        body: JSON.stringify({
                            collection_id: parseInt(collectionId),
                            title: file.name.replace(/\\.[^/.]+$/, ''),
                            item_type: getItemType(file.type),
                            media_url: uploadResult.media_url,
                            thumbnail_url: uploadResult.thumbnail_url,
                            is_public: true
                        })
                    });
                } catch (err) {
                    console.error('Upload failed for', file.name, err);
                }
            }
            
            selectedFiles = [];
            displaySelectedFiles();
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Files';
            alert('Upload complete!');
        }

        // Helper functions
        function getItemType(mimeType) {
            if (mimeType.startsWith('image/')) return 'image';
            if (mimeType === 'application/pdf') return 'document';
            if (mimeType.startsWith('audio/')) return 'audio';
            if (mimeType.startsWith('video/')) return 'video';
            if (mimeType.includes('gltf') || mimeType.includes('glb')) return '3d';
            return 'document';
        }

        function getItemIcon(type) {
            const icons = {
                image: '🖼️',
                document: '📄',
                audio: '🎵',
                video: '🎬',
                '3d': '🎲'
            };
            return icons[type] || '📁';
        }

        // Handle enter key on login
        document.getElementById('password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
        document.getElementById('email').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });

        // Drag and drop
        const dropZone = document.querySelector('.border-dashed');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('border-indigo-500');
            });
            
            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('border-indigo-500');
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-indigo-500');
                const files = Array.from(e.dataTransfer.files);
                selectedFiles = [...selectedFiles, ...files];
                displaySelectedFiles();
            });
        }
    </script>
</body>
</html>`;
}