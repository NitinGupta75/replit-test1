document.addEventListener('DOMContentLoaded', function() {
    const loadOption = document.getElementById('load-option');
    const loadWindow = document.getElementById('load-window');
    const browseOption = document.getElementById('browse-option');
    const browseWindow = document.getElementById('browse-window');
    const fileList = document.getElementById('file-list');
    const loadFile = document.getElementById('load-file');
    const loadWebpage = document.getElementById('load-webpage');
    const loadImage = document.getElementById('load-image');
    const fileInput = document.getElementById('file-input');
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const googleDriveBtn = document.getElementById('google-drive-btn');

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

    function fetchAndDisplayFiles() {
        fetch('/files')
            .then(response => response.json())
            .then(files => {
                fileList.innerHTML = '';
                files.forEach(file => {
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
});
