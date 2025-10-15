#!/bin/bash

# FaceAttend - Start All Services
# This script starts the Python FaceNet service, Node.js backend, and React Native client

echo "🚀 Starting FaceAttend Services..."

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Check if ports are available
if check_port 5001; then
    echo "❌ Port 5001 is already in use (FaceNet service)"
    echo "Please stop the service using port 5001 and try again"
    exit 1
fi

if check_port 3000; then
    echo "❌ Port 3000 is already in use (Node.js backend)"
    echo "Please stop the service using port 3000 and try again"
    exit 1
fi

# Start Python FaceNet service
echo "🐍 Starting FaceNet Recognition Service..."
cd facenet_service
python face_recognition_service.py &
FACENET_PID=$!
cd ..

# Wait for FaceNet service to start
echo "⏳ Waiting for FaceNet service to initialize..."
sleep 3

# Check if FaceNet service is running
if ! check_port 5001; then
    echo "❌ Failed to start FaceNet service"
    kill $FACENET_PID 2>/dev/null
    exit 1
fi

echo "✅ FaceNet service started on port 5001"

# Start Node.js backend
echo "🟦 Starting Node.js Backend..."
cd server
npm install  # Install dependencies if needed
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Check if backend is running
if ! check_port 3000; then
    echo "❌ Failed to start Node.js backend"
    kill $FACENET_PID $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend started on port 3000"

# Start React Native client
echo "📱 Starting React Native Client..."
cd client
npx expo start &
CLIENT_PID=$!
cd ..

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📋 Service Status:"
echo "   🐍 FaceNet Service: http://localhost:5001"
echo "   🟦 Node.js Backend: http://localhost:3000"
echo "   📱 React Native Client: http://localhost:8081 (Expo)"
echo ""
echo "🔧 To stop all services, press Ctrl+C or run:"
echo "   kill $FACENET_PID $BACKEND_PID $CLIENT_PID"
echo ""

# Wait for user interrupt
trap 'echo "🛑 Stopping all services..."; kill $FACENET_PID $BACKEND_PID $CLIENT_PID 2>/dev/null; exit 0' INT

# Keep script running
wait
