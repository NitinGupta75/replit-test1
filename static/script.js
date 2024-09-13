document.addEventListener('DOMContentLoaded', function() {
    const loadOption = document.getElementById('load-option');
    const loadWindow = document.getElementById('load-window');
    const browseOption = document.getElementById('browse-option');
    const browseWindow = document.getElementById('browse-window');
    const fileList = document.getElementById('file-list');
    const databaseInfo = document.getElementById('database-info');
    const loadFile = document.getElementById('load-file');
    const loadWebpage = document.getElementById('load-webpage');
    const loadImage = document.getElementById('load-image');
    const fileInput = document.getElementById('file-input');
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const googleDriveBtn = document.getElementById('google-drive-btn');

    let currentView = 'files';
    let currentPage = 1;
    const itemsPerPage = 10;

    loadOption.addEventListener('click', function(e) {
        e.preventDefault();
        toggleWindow(loadWindow, loadOption);
    });

    browseOption.addEventListener('click', function(e) {
        e.preventDefault();
        toggleWindow(browseWindow, browseOption);
        fetchAndDisplayFiles();
        fetchAndDisplayDatabaseInfo();
    });

    // Close the windows when clicking outside of them
    document.addEventListener('click', function(e) {
        if (!loadWindow.contains(e.target) && e.target !== loadOption) {
            loadWindow.style.display = 'none';
        }
        if (!browseWindow.contains(e.target) && e.target !== browseOption) {
            browseWindow.style.display = 'none';
        }
    });

    loadFile.addEventListener('click', function(e) {
        e.preventDefault();
        fileInput.click();
    });

    fileUploadBtn.addEventListener('click', function(e) {
        e.preventDefault();
        fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            uploadFile(file);
        }
    });

    googleDriveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Google Drive upload not implemented yet');
    });

    loadWebpage.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Webpage option clicked');
    });

    loadImage.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Image option clicked');
    });

    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('File uploaded successfully:', data);
            alert('File uploaded successfully!');
            fetchAndDisplayFiles();
            fetchAndDisplayDatabaseInfo();
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            alert('Error uploading file. Please try again.');
        });
    }

    function toggleWindow(window, option) {
        if (window.style.display === 'none' || window.style.display === '') {
            const rect = option.getBoundingClientRect();
            window.style.top = `${rect.top}px`;
            window.style.left = `${rect.right + 10}px`;
            window.style.display = 'block';
        } else {
            window.style.display = 'none';
        }
    }

    function toggleView() {
        const fileListContainer = document.getElementById('file-list-container');
        const databaseInfoContainer = document.getElementById('database-info-container');
        const toggleViewBtn = document.getElementById('toggle-view-btn');

        if (currentView === 'files') {
            fileListContainer.style.display = 'none';
            databaseInfoContainer.style.display = 'block';
            toggleViewBtn.textContent = 'Show Files';
            currentView = 'database';
            fetchAndDisplayDatabaseInfo();
        } else {
            fileListContainer.style.display = 'block';
            databaseInfoContainer.style.display = 'none';
            toggleViewBtn.textContent = 'Show Database Info';
            currentView = 'files';
            fetchAndDisplayFiles();
        }
    }

    function searchFiles() {
        const searchInput = document.getElementById('search-input');
        const searchTerm = searchInput.value.toLowerCase();
        currentPage = 1;
        fetchAndDisplayFiles(searchTerm);
    }

    function createPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const paginationElement = document.getElementById('pagination');
        paginationElement.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                fetchAndDisplayFiles();
            });
            paginationElement.appendChild(pageButton);
        }
    }

    function fetchAndDisplayFiles(searchTerm = '') {
        fetch(`/files?page=${currentPage}&items_per_page=${itemsPerPage}&search=${searchTerm}`)
            .then(response => response.json())
            .then(data => {
                fileList.innerHTML = '';
                data.files.forEach(file => {
                    const fileElement = document.createElement('div');
                    fileElement.classList.add('file-item');
                    fileElement.innerHTML = `
                        <span>${file.file_name}</span>
                        <span>${formatDate(file.uploaded_date)}</span>
                        <span>${file.size_mb.toFixed(2)} MB</span>
                        <button class="download-btn" data-id="${file.id}">Download</button>
                    `;
                    fileList.appendChild(fileElement);
                });

                createPagination(data.total_files);

                // Add event listeners for download buttons
                const downloadButtons = document.querySelectorAll('.download-btn');
                downloadButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const fileId = this.getAttribute('data-id');
                        downloadFile(fileId);
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching files:', error);
                fileList.innerHTML = '<p>Error fetching files. Please try again.</p>';
            });
    }

    function fetchAndDisplayDatabaseInfo() {
        fetch('/database_info')
            .then(response => response.json())
            .then(info => {
                document.getElementById('total-files').textContent = info.total_files;
                document.getElementById('total-size').textContent = `${info.total_size_mb.toFixed(2)} MB`;
                document.getElementById('latest-upload').textContent = info.latest_upload || 'N/A';
                document.getElementById('latest-upload-date').textContent = info.latest_upload_date ? formatDate(info.latest_upload_date) : 'N/A';

                // Display additional database information if needed
                databaseInfo.innerHTML = `
                    <p>Additional database information can be displayed here.</p>
                `;
            })
            .catch(error => {
                console.error('Error fetching database info:', error);
                databaseInfo.innerHTML = '<p>Error fetching database information. Please try again.</p>';
            });
    }

    function downloadFile(fileId) {
        fetch(`/download/${fileId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('File download failed');
                }
                return response.blob();
            })
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `file_${fileId}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Error downloading file:', error);
                alert('Error downloading file. Please try again.');
            });
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    // Add event listeners for new functionalities
    document.getElementById('toggle-view-btn').addEventListener('click', toggleView);
    document.getElementById('search-input').addEventListener('input', searchFiles);
});
