document.addEventListener('DOMContentLoaded', function() {
    const loadOption = document.getElementById('load-option');
    const loadWindow = document.getElementById('load-window');
    const browseOption = document.getElementById('browse-option');
    const browseWindow = document.getElementById('browse-window');
    const fileList = document.getElementById('file-list');
    const loadWebpage = document.getElementById('load-webpage');
    const loadImage = document.getElementById('load-image');
    const fileInput = document.getElementById('file-input');
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const googleDriveBtn = document.getElementById('google-drive-btn');

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
                        <span title="${file.file_name}">${file.file_name}</span>
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

    // Add event listener for search functionality
    document.getElementById('search-input').addEventListener('input', searchFiles);
});
