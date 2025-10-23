// Face processing utilities - server-side processing only
// All face recognition is handled by the Python FaceNet microservice

export async function extractSingleFaceDescriptorAsync(imageBase64: string): Promise<number[] | null> {
  console.log('[face-utils] Processing image for face detection...');
  console.log('[face-utils] Image base64 length:', imageBase64.length);

  // Clean the base64 string - remove data URL prefix if present
  let cleanBase64 = imageBase64;
  if (imageBase64.includes(',')) {
    cleanBase64 = imageBase64.split(',')[1];
    console.log('[face-utils] Removed data URL prefix');
  }

  console.log('[face-utils] Clean base64 length:', cleanBase64.length);
  
  // All face recognition is handled by the Python FaceNet microservice
  // This function returns null to trigger server-side processing
  console.log('[face-utils] Using server-side processing for accurate face recognition');
  return null; // This will trigger server-side processing
}



