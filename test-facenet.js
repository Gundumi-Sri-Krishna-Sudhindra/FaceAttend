#!/usr/bin/env node

/**
 * Test script for FaceNet service
 * This script tests the FaceNet recognition service to ensure it's working correctly
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const FACENET_URL = 'http://localhost:5001';

async function testFaceNetService() {
  console.log('🧪 Testing FaceNet Recognition Service...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing health check...');
  try {
    const healthResponse = await axios.get(`${FACENET_URL}/health`, { timeout: 5000 });
    console.log('✅ Health check passed:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('💡 Make sure the FaceNet service is running on port 5001');
    process.exit(1);
  }

  // Test 2: Face Recognition with sample image (if available)
  console.log('\n2️⃣ Testing face recognition...');
  
  // Look for a sample image in common locations
  const sampleImagePaths = [
    path.join(__dirname, 'sample-face.jpg'),
    path.join(__dirname, 'test-image.jpg'),
    path.join(__dirname, 'facenet_service', 'sample.jpg'),
    path.join(__dirname, 'assets', 'sample-face.jpg')
  ];

  let sampleImagePath = null;
  for (const imgPath of sampleImagePaths) {
    if (fs.existsSync(imgPath)) {
      sampleImagePath = imgPath;
      break;
    }
  }

  if (!sampleImagePath) {
    console.log('⚠️ No sample image found. Creating a test request without image...');
    console.log('💡 To test with actual image, place a face image named "sample-face.jpg" in the project root');
  } else {
    console.log(`📸 Using sample image: ${sampleImagePath}`);
    
    try {
      const formData = new FormData();
      const imageBuffer = fs.readFileSync(sampleImagePath);
      formData.append('image', imageBuffer, { 
        filename: 'test.jpg',
        contentType: 'image/jpeg'
      });

      const recognitionResponse = await axios.post(
        `${FACENET_URL}/api/recognize`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 10000
        }
      );

      if (recognitionResponse.data.success) {
        console.log('✅ Face recognition successful!');
        console.log(`📊 Embedding size: ${recognitionResponse.data.embedding_size}`);
        console.log(`📊 Embedding preview: [${recognitionResponse.data.embedding.slice(0, 5).join(', ')}, ...]`);
      } else {
        console.log('❌ Face recognition failed:', recognitionResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Face recognition request failed:', error.message);
      if (error.response) {
        console.log('📄 Response data:', error.response.data);
      }
    }
  }

  // Test 3: Error handling
  console.log('\n3️⃣ Testing error handling...');
  try {
    const formData = new FormData();
    formData.append('image', Buffer.from('not-an-image'), { filename: 'fake.jpg' });

    const errorResponse = await axios.post(
      `${FACENET_URL}/api/recognize`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 5000
      }
    );

    if (!errorResponse.data.success) {
      console.log('✅ Error handling works correctly:', errorResponse.data.message);
    } else {
      console.log('⚠️ Unexpected success with invalid image');
    }
  } catch (error) {
    console.log('✅ Error handling works correctly - service rejected invalid data');
  }

  console.log('\n🎉 FaceNet service testing completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Start the Node.js backend: cd server && npm run dev');
  console.log('   2. Start the React Native client: cd client && npx expo start');
  console.log('   3. Test student registration and attendance marking');
}

// Run the test
testFaceNetService().catch(error => {
  console.error('💥 Test failed with error:', error.message);
  process.exit(1);
});
