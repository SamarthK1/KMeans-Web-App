from flask import Flask, request, send_file, jsonify
import numpy as np
import cv2
import random
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  

'''
Flask Backend for the K-Means Implementation.
'''
# Initialize random centroids from the image.
def initialize_centroids(pixels, k):
    indices = random.sample(range(len(pixels)), k)
    centroids = pixels[indices]

    return centroids

# Use Euclidean distance to assign pixels to their closest centroids.
def closest_centroid(pixels, centroids):
    distances = np.sqrt(((pixels - centroids[:, np.newaxis])**2).sum(axis=2))

    return np.argmin(distances, axis=0)

# Update the centroids by calculating the mean of all pixels assigned to each centroid.
def update_centroids(pixels, labels, k):
    new_centroids = np.zeros((k, 3))

    for i in range(k):
        new_centroids[i] = np.mean(pixels[labels == i], axis=0)
    return new_centroids

# K_means algorithm, returns centroids and labels.
def k_means(pixels, k):

    # First, randomly initialize the centroids.
    centroids = initialize_centroids(pixels, k)

    # Assign pixels to their closest centroids and update the centroids based on their means.
    for i in range(100):
        labels = closest_centroid(pixels, centroids)
        new_centroids = update_centroids(pixels, labels, k)

        # Check for convergence, when centroids are unchanged.
        if np.all(centroids == new_centroids):
            break

        centroids = new_centroids

    return centroids, labels

# Process the image and return the result to the frontend.
@app.route("/process", methods=["POST"])
def process_image():
    try:
        file = request.files['image']
        k = int(request.form['k'])

        # Save the original image.
        input_path = "input.png"
        file.save(input_path)

        # Read the image using OpenCV library.
        img = cv2.imread(input_path)
        if img is None:
            return jsonify({"error": "Invalid image file"}), 400

        pixels = img.reshape((-1, 3)).astype(np.float32)

        # Run the K-Means algorithm.
        centroids, labels = k_means(pixels, k)

        # Assign pixels to their cluster color.
        new_pixels = np.array([centroids[label] for label in labels], dtype=np.uint8)
        clustered_img = new_pixels.reshape(img.shape)

        # Save the resulting image.
        output_path = "clustered_output.png"
        cv2.imwrite(output_path, clustered_img)

        # Return the image.
        return send_file(output_path, mimetype="image/png")

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
