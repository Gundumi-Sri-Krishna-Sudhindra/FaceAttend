import axios from "axios";
import FormData from "form-data";

const FACENET_SERVICE_URL = process.env.FACENET_SERVICE_URL;

export interface FaceRecognitionResult {
  success: boolean;
  embedding?: number[];
  embedding_size?: number;
  message?: string;
}

/**
 * Extract face embedding from base64 image using FaceNet service
 * @param base64Image - Base64 encoded image string
 * @returns Face embedding vector (512 dimensions)
 */
export async function getFaceEmbedding(base64Image: string): Promise<number[]> {
  try {
    const formData = new FormData();
    const imageBuffer = Buffer.from(base64Image, "base64");
    
    formData.append("image", imageBuffer, { 
      filename: "frame.jpg",
      contentType: "image/jpeg"
    });

    const response = await axios.post<FaceRecognitionResult>(
      `${FACENET_SERVICE_URL}/api/recognize`, 
      formData, 
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 10000, // 10 second timeout
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Face not detected");
    }

    if (!response.data.embedding) {
      throw new Error("No embedding returned from FaceNet service");
    }

    return response.data.embedding;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error("FaceNet service is not running. Please start the Python service first.");
      }
      throw new Error(`FaceNet service error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Health check for FaceNet service
 */
export async function checkFaceNetHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${FACENET_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
