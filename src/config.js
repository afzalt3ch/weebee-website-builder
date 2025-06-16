document.getElementById('startEditor').addEventListener('click', () => {
    const websiteName = document.getElementById('websiteName').value;
    const websiteWidth = document.getElementById('websiteWidth').value;

    if (!websiteName) {
        alert('Please enter a website name');
        return;
    }

    window.electronAPI.createEditor({
        name: websiteName,
        width: parseInt(websiteWidth) || 1200
    });
});
