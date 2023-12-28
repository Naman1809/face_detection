import React, { useRef, useState, useEffect } from 'react';
import { fabric } from 'fabric';
import * as faceapi from 'face-api.js';
import ReactPlayer from 'react-player';
import "./VideoPlayer.css"

const VideoPlayer = () => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoFile) {
      initializeCanvas();
      loadFaceDetectionModel();
    }
  }, [videoFile]);

  const initializeCanvas = () => {
    const canvas = new fabric.Canvas(canvasRef.current);
    canvas.setWidth(640);
    canvas.setHeight(360);

    const videoElement = videoRef.current.getInternalPlayer();
    const videoWidth = videoElement?.videoWidth || 640;
    const videoHeight = videoElement?.videoHeight || 360;

    const video = new fabric.Image(videoElement, {
      left: 0,
      top: 0,
      selectable: false,
      evented: false,
      scaleX: canvas.width / videoWidth,
      scaleY: canvas.height / videoHeight,
      width: canvas.width,
      height: canvas.height,
    });

    canvas.add(video);
  };

  const loadFaceDetectionModel = async () => {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  };

  const detectFaces = async () => {
    const video = videoRef.current.getInternalPlayer();

    if (!video || !video.videoWidth || !video.videoHeight) {
      console.error('Video or its dimensions are not available.');
      return;
    }

    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const canvasContext = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (canvasContext) {
        canvasContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
      }
    }, 100);
  };

  const handleVideoReady = () => {
    detectFaces();
  };

  const handleVideoChange = (file) => {
    setVideoFile(file);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleChooseFile = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="container">
      <ReactPlayer
        ref={(player) => (videoRef.current = player)}
        url={videoFile ? URL.createObjectURL(videoFile) : ''}
        playing={isPlaying}
        controls
        width="640px"
        height="360px"
        onReady={handleVideoReady}
        className="react-player"
      />
      <canvas className="canvas-overlay" ref={canvasRef} />
      <input
        type="file"
        accept="video/*"
        onChange={(e) => handleVideoChange(e.target.files[0])}
        ref={fileInputRef}
        className="file-input"
      />
      <button onClick={handlePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
      <button onClick={handleChooseFile}>Choose File</button>
    </div>
  );
};

export default VideoPlayer;