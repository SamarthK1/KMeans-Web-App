document.getElementById('processButton').addEventListener('click', async () => {
    const imageUpload = document.getElementById('imageUpload').files[0];
    const kValue = parseInt(document.getElementById('kValue').value);

    if (!imageUpload || !kValue || kValue < 1) {
        alert('Please upload an image and enter a valid K value.');
        return;
    }

    const originalCanvas = document.getElementById('originalCanvas');
    const clusteredCanvas = document.getElementById('clusteredCanvas');
    const originalCtx = originalCanvas.getContext('2d');
    const clusteredCtx = clusteredCanvas.getContext('2d');

    // Load and display original image before sending it to Flask
    const img = new Image();
    img.onload = async () => {
        originalCanvas.width = img.width;
        originalCanvas.height = img.height;
        clusteredCanvas.width = img.width;
        clusteredCanvas.height = img.height;
        originalCtx.drawImage(img, 0, 0); // Keep the original image displayed

        // Prepare data for Flask backend
        const formData = new FormData();
        formData.append("image", imageUpload);
        formData.append("k", kValue);

        try {
            const response = await fetch("http://127.0.0.1:5000/process", {
                method: "POST",
                body: formData
            });

            if (!response.ok) throw new Error("Server error processing image");

            // Convert response to blob and display the processed image
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const clusteredImg = new Image();
            clusteredImg.onload = () => {
                clusteredCtx.drawImage(clusteredImg, 0, 0);
                document.getElementById('saveButton').disabled = false; // Enable save button
                document.getElementById('saveButton').setAttribute("data-url", url); // Store URL for saving
            };
            clusteredImg.src = url;

        } catch (error) {
            console.error("Error:", error);
            alert("Failed to process image. Check server.");
        }
    };
    img.src = URL.createObjectURL(imageUpload);
});

// Reset button - Clears images from screen
document.getElementById('resetButton').addEventListener('click', () => {
    document.getElementById('imageUpload').value = null;
    document.getElementById('kValue').value = '';

    const originalCanvas = document.getElementById('originalCanvas');
    const clusteredCanvas = document.getElementById('clusteredCanvas');
    const originalCtx = originalCanvas.getContext('2d');
    const clusteredCtx = clusteredCanvas.getContext('2d');

    originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
    clusteredCtx.clearRect(0, 0, clusteredCanvas.width, clusteredCanvas.height);
});

// Save button - Only downloads clustered image when clicked
document.getElementById('saveButton').addEventListener('click', () => {
    const url = document.getElementById('saveButton').getAttribute("data-url");
    if (url) {
        const link = document.createElement('a');
        link.download = 'clustered-image.png';
        link.href = url;
        link.click();
    } else {
        alert("No clustered image available to save.");
    }
});
