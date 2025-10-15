# FaceNet Recognition Service

This is a Python Flask microservice that provides accurate face recognition using FaceNet embeddings.

## Features

- **High Accuracy**: Uses pre-trained FaceNet model for face recognition
- **REST API**: Simple HTTP interface for integration
- **Face Detection**: Automatic face detection and cropping
- **512D Embeddings**: Generates 512-dimensional face embeddings
- **Health Check**: Built-in health monitoring endpoint

## Installation

1. **Install Python Dependencies**:
   ```bash
   cd facenet_service
   pip install -r requirements.txt
   ```

2. **Start the Service**:
   ```bash
   python face_recognition_service.py
   ```

The service will start on `http://localhost:5001`

## API Endpoints

### POST `/api/recognize`
Extract face embedding from an uploaded image.

**Request**:
- Method: POST
- Content-Type: multipart/form-data
- Body: Form field `image` containing the image file

**Response**:
```json
{
  "success": true,
  "embedding": [0.1, 0.2, ...], // 512-dimensional array
  "embedding_size": 512
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "No face detected"
}
```

### GET `/health`
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "service": "facenet-recognition"
}
```

## Integration with Node.js Backend

The Node.js backend automatically communicates with this service using the `facenet.service.ts` module.

## Troubleshooting

1. **"FaceNet service is not running"**: Make sure the Python service is started on port 5001
2. **"No face detected"**: Ensure the uploaded image contains a clear, well-lit face
3. **Import errors**: Run `pip install -r requirements.txt` to install all dependencies

## Model Information

- **Face Detection**: MTCNN (Multi-task CNN)
- **Face Recognition**: InceptionResnetV1 pre-trained on VGGFace2
- **Embedding Size**: 512 dimensions
- **Similarity**: Cosine similarity recommended (threshold ~0.6)
