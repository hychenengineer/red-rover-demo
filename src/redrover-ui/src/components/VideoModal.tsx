import React from 'react';
import { X, Play, ExternalLink } from 'lucide-react';

export interface VideoInfo {
  title: string;
  category: string;
  url: string;
  description: string;
}

export const RED_ROVER_VIDEOS: Record<string, VideoInfo> = {
  admin: {
    title: 'Admin Basic Training Walkthrough',
    category: 'Admin Live Absence Management',
    url: 'https://7368913.fs1.hubspotusercontent-na1.net/hubfs/7368913/Admin%20Basic%20Training.mp4',
    description: 'Official Red Rover administration workflow: Daily absence tracking, fill-rate management, and manual override assignment.'
  },
  teacher: {
    title: '2024 Employee Basic Training',
    category: 'Teacher Absence Booking',
    url: 'https://7368913.fs1.hubspotusercontent-na1.net/hubfs/7368913/2024%20Employee%20Basic%20Training%20Video.mp4',
    description: 'Teacher absence creation: Selecting absence reason, lesson plan notes, room numbers, and automated sub dispatch.'
  },
  substitute: {
    title: 'Substitute Basic Training',
    category: 'Substitute Shift Claiming',
    url: 'https://7368913.fs1.hubspotusercontent-na1.net/hubfs/7368913/Substitute%20Basic%20Training.mp4',
    description: 'Substitute mobile experience: Receiving 6:00 AM notifications, viewing lesson notes, and one-tap shift acceptance.'
  },
  timetracking: {
    title: 'Time & Attendance / Extra Duty Stipends',
    category: 'Time Tracking & Kiosk',
    url: 'https://7368913.fs1.hubspotusercontent-na1.net/hubfs/7368913/timeTracking.mp4',
    description: 'Hardware kiosk PIN entry for hourly staff and teacher Extra Duty prep-coverage stipend claims.'
  },
  records: {
    title: 'Personnel Records & Document Vault',
    category: 'HR Compliance & Vault',
    url: 'https://7368913.fs1.hubspotusercontent-na1.net/hubfs/7368913/video_assets/208775620682/inherited/web_optimized.mp4',
    description: 'District credential compliance tracking, state certification expiration monitoring, and digital personnel records.'
  }
};

interface VideoModalProps {
  videoKey: string | null;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ videoKey, onClose }) => {
  if (!videoKey || !RED_ROVER_VIDEOS[videoKey]) return null;

  const video = RED_ROVER_VIDEOS[videoKey];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card video-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex-items-center gap-2">
            <span className="badge badge-red">{video.category}</span>
            <h3 style={{ margin: 0 }}>{video.title}</h3>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="video-container">
          <video controls autoPlay className="video-player" key={video.url}>
            <source src={video.url} type="video/mp4" />
            Your browser does not support HTML5 video streaming.
          </video>
        </div>

        <div className="video-meta">
          <p className="text-muted">{video.description}</p>
          <div className="flex-between">
            <span className="text-xs text-muted">Source: Official Red Rover Training Hub</span>
            <a href={video.url} target="_blank" rel="noreferrer" className="link-ext">
              Open MP4 Direct Stream <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
