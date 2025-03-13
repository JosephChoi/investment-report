import { useState } from 'react';
import { Announcement } from '@/lib/types';
import AnnouncementList from './announcement-list';
import AnnouncementDetail from './announcement-detail';

export default function DashboardAnnouncements() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 공지사항 상세 보기
  const handleViewDetail = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailModal(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedAnnouncement(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">공지사항</h2>
      </div>
      
      <AnnouncementList
        onViewDetail={handleViewDetail}
      />
      
      {showDetailModal && selectedAnnouncement && (
        <AnnouncementDetail
          announcementId={selectedAnnouncement.id}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
} 