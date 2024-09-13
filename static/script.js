document.addEventListener('DOMContentLoaded', function() {
    const loadOption = document.getElementById('load-option');
    const loadWindow = document.getElementById('load-window');
    const loadFile = document.getElementById('load-file');
    const loadWebpage = document.getElementById('load-webpage');
    const loadImage = document.getElementById('load-image');

    loadOption.addEventListener('click', function(e) {
        e.preventDefault();
        loadWindow.style.display = loadWindow.style.display === 'none' ? 'block' : 'none';
    });

    // Close the window when clicking outside of it
    document.addEventListener('click', function(e) {
        if (!loadWindow.contains(e.target) && e.target !== loadOption) {
            loadWindow.style.display = 'none';
        }
    });

    // Add click event listeners for the new options
    loadFile.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('File option clicked');
    });

    loadWebpage.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Webpage option clicked');
    });

    loadImage.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Image option clicked');
    });
});
