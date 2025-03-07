'use client';

import { useState } from 'react';
import Image from 'next/image';

// 샘플 이미지 URL (실제 구현에서는 Supabase Storage에서 가져온 URL로 대체)
const sampleReportUrl = '/sample-portfolio-report.jpg';

export default function PortfolioReport() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
        {/* 실제 구현에서는 Supabase Storage에서 이미지를 가져옵니다 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">포트폴리오 리포트 이미지가 로드됩니다...</p>
        </div>
        
        {/* 이미지가 있을 경우 표시 (현재는 주석 처리) */}
        {/* <Image
          src={sampleReportUrl}
          alt="포트폴리오 리포트"
          fill
          style={{ objectFit: 'contain' }}
        /> */}
      </div>
      <div className="mt-4 text-right">
        <button 
          className="text-gray-700 hover:text-gray-900 hover:underline"
          onClick={openModal}
        >
          전체 화면으로 보기
        </button>
      </div>

      {/* 모달은 나중에 구현 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-md max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">포트폴리오 리포트</h3>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-900"
              >
                닫기
              </button>
            </div>
            <div className="w-full aspect-video relative bg-gray-100 rounded-lg">
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500">포트폴리오 리포트 이미지가 로드됩니다...</p>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              2024년 3월 성장형 포트폴리오 리포트
            </div>
          </div>
        </div>
      )}
    </>
  );
} 