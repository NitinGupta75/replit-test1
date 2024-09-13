document.addEventListener('DOMContentLoaded', function() {
    const loadOption = document.getElementById('load-option');
    const loadWindow = document.getElementById('load-window');
    const loadFile = document.getElementById('load-file');
    const loadWebpage = document.getElementById('load-webpage');
    const loadImage = document.getElementById('load-image');
    const fileInput = document.getElementById('file-input');
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const googleDriveBtn = document.getElementById('google-drive-btn');
    const fileList = document.getElementById('file-list');

    loadOption.addEventListener('click', function(e) {
        e.preventDefault();
        if (loadWindow.style.display === 'none' || loadWindow.style.display === '') {
            const rect = loadOption.getBoundingClientRect();
            loadWindow.style.top = `${rect.top}px`;
            loadWindow.style.left = `${rect.right + 10}px`;
            loadWindow.style.display = 'block';
        } else {
            loadWindow.style.display = 'none';
        }
    });

    // Close the window when clicking outside of it
    document.addEventListener('click', function(e) {
        if (!loadWindow.contains(e.target) && e.target !== loadOption) {
            loadWindow.style.display = 'none';
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
            fetchFileList(); // Fetch the updated file list after successful upload
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            alert('Error uploading file. Please try again.');
        });
    }

    function fetchFileList() {
        fetch('/list_files')
            .then(response => response.json())
            .then(data => {
                updateFileList(data.files);
            })
            .catch(error => {
                console.error('Error fetching file list:', error);
            });
    }

    function updateFileList(files) {
        fileList.innerHTML = ''; // Clear existing list
        files.forEach(file => {
            const li = document.createElement('li');
            li.textContent = `${file.file_name} (${file.size_mb} MB) - Uploaded on ${new Date(file.uploaded_date).toLocaleString()}`;
            fileList.appendChild(li);
        });
    }

    // Fetch the file list when the page loads
    fetchFileList();
});
