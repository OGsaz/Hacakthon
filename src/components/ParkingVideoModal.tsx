import React from 'react';
import { X, Play, Pause, Volume2, VolumeX, RotateCcw, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ParkingVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ParkingVideoModal: React.FC<ParkingVideoModalProps> = ({ isOpen, onClose }) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [videoError, setVideoError] = React.useState(false);
  const [videoLoading, setVideoLoading] = React.useState(true);

  // Handle video play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle video restart
  const restartVideo = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle video time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setVideoLoading(false);
    }
  };

  // Handle video can play
  const handleCanPlay = () => {
    setVideoLoading(false);
  };

  // Handle video ended
  const handleVideoEnded = () => {
    setIsPlaying(false);
    // Auto-restart the video for continuous loop effect
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle video error
  const handleVideoError = () => {
    setVideoError(true);
    setIsPlaying(false);
  };

  // Auto-play video when modal opens
  React.useEffect(() => {
    if (isOpen && !videoError) {
      setVideoLoading(true);
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        if (videoRef.current) {
          const video = videoRef.current;
          video.currentTime = 0;
          video.play().then(() => {
            setIsPlaying(true);
          }).catch((error) => {
            console.error('Autoplay failed:', error);
            // If autoplay fails, user can still manually play
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen, videoError]);

  // Format time in MM:SS format
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[90vw] h-[85vh] p-0 bg-black/95 border border-border/50">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white">
              Smart Parking - Live Camera Feed
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col p-4 pt-2">
          {/* Video Container */}
          <div className="relative flex-1 bg-black rounded-lg overflow-hidden min-h-0">
            {videoError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-white">
                <div className="text-center space-y-4">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">Video Not Found</h3>
                    <p className="text-gray-400 mb-4">
                      Please add your parking lot wobble video file to the public directory
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Required: <code className="bg-gray-800 px-2 py-1 rounded">parking_lot_wobble_effect_looped.mp4</code></p>
                      <p>Optional: <code className="bg-gray-800 px-2 py-1 rounded">parking-poster.jpg</code></p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-contain bg-black"
                loop
                autoPlay
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onCanPlay={handleCanPlay}
                onEnded={handleVideoEnded}
                onError={handleVideoError}
                poster="/parking-poster.jpg" // Fallback image if video fails to load
              >
                <source src="/parking_lot_wobble_effect_looped.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}

            {/* Loading Overlay */}
            {videoLoading && !videoError && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">Loading video...</p>
                </div>
              </div>
            )}

            {/* Video Overlay with Parking Info */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">LIVE</span>
              </div>
              <p className="text-xs text-gray-300">Parking Lot A - Camera 1</p>
            </div>

            {/* Parking Status Overlay */}
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg p-2 text-white">
              <div className="text-center">
                <p className="text-lg font-bold text-green-400">12</p>
                <p className="text-xs text-gray-300">Available Spots</p>
              </div>
            </div>
          </div>

          {/* Video Controls */}
          <div className="flex items-center justify-between mt-3 p-3 bg-black/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlayPause}
                disabled={videoError}
                className="text-white hover:bg-white/10 disabled:opacity-50"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                disabled={videoError}
                className="text-white hover:bg-white/10 disabled:opacity-50"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={restartVideo}
                disabled={videoError}
                className="text-white hover:bg-white/10 disabled:opacity-50"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3 text-white">
              <span className="text-sm">{formatTime(currentTime)}</span>
              <span className="text-sm text-gray-400">/</span>
              <span className="text-sm text-gray-400">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">AI Detection Active</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-3 p-3 bg-gradient-to-r from-blue-900/20 to-green-900/20 rounded-lg border border-blue-500/20">
            <div className="grid grid-cols-3 gap-4 text-center text-white">
              <div>
                <p className="text-2xl font-bold text-blue-400">18</p>
                <p className="text-xs text-gray-300">Total Cameras</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">94%</p>
                <p className="text-xs text-gray-300">Detection Accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">2.3s</p>
                <p className="text-xs text-gray-300">Avg Response Time</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParkingVideoModal;
