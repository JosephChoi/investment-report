'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Edit, Trash } from 'lucide-react';

// 상담 내역 타입 정의
interface Consultation {
  id: number;
  customerName: string;
  customerAccount: string;
  date: string;
  title: string;
  content: string;
}

// 샘플 상담 내역 데이터
const sampleConsultations: Consultation[] = [
  {
    id: 1,
    customerName: '홍길동',
    customerAccount: '123-456-789012',
    date: '2024-03-15',
    title: '포트폴리오 리밸런싱 문의',
    content: '현재 포트폴리오의 리밸런싱이 필요한지 문의드립니다. 최근 시장 상황을 고려했을 때 어떤 조정이 필요할까요?'
  },
  {
    id: 2,
    customerName: '김철수',
    customerAccount: '234-567-890123',
    date: '2024-03-10',
    title: '추가 투자 상담',
    content: '추가 자금 투자를 고려 중입니다. 현재 시장 상황에서 어떤 포트폴리오가 적합할지 상담 요청드립니다.'
  },
  {
    id: 3,
    customerName: '이영희',
    customerAccount: '345-678-901234',
    date: '2024-03-05',
    title: '연체 관련 문의',
    content: '지난 달 연체 내역에 대해 문의드립니다. 연체 이자는 어떻게 계산되나요?'
  }
];

export default function ConsultationAdmin() {
  const [consultations, setConsultations] = useState<Consultation[]>(sampleConsultations);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // 폼 상태
  const [formData, setFormData] = useState({
    customerName: '',
    customerAccount: '',
    date: '',
    title: '',
    content: ''
  });
  
  // 검색 기능
  const filteredConsultations = consultations.filter(
    (consultation) =>
      consultation.customerName.includes(searchTerm) ||
      consultation.customerAccount.includes(searchTerm) ||
      consultation.title.includes(searchTerm)
  );
  
  // 폼 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 상담 내역 추가/수정 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // 수정 모드
      setConsultations(
        consultations.map((consultation) =>
          consultation.id === editingId
            ? { ...formData, id: editingId }
            : consultation
        )
      );
      setEditingId(null);
    } else {
      // 추가 모드
      const newConsultation: Consultation = {
        ...formData,
        id: Math.max(0, ...consultations.map((c) => c.id)) + 1
      };
      setConsultations([...consultations, newConsultation]);
    }
    
    // 폼 초기화
    setFormData({
      customerName: '',
      customerAccount: '',
      date: '',
      title: '',
      content: ''
    });
    setShowForm(false);
  };
  
  // 상담 내역 수정 핸들러
  const handleEdit = (id: number) => {
    const consultationToEdit = consultations.find((c) => c.id === id);
    if (consultationToEdit) {
      setFormData({
        customerName: consultationToEdit.customerName,
        customerAccount: consultationToEdit.customerAccount,
        date: consultationToEdit.date,
        title: consultationToEdit.title,
        content: consultationToEdit.content
      });
      setEditingId(id);
      setShowForm(true);
    }
  };
  
  // 상담 내역 삭제 핸들러
  const handleDelete = (id: number) => {
    if (window.confirm('정말로 이 상담 내역을 삭제하시겠습니까?')) {
      setConsultations(consultations.filter((c) => c.id !== id));
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-gray-700 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>관리자 페이지로 돌아가기</span>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-2 text-gray-900">관리자 상담 내역 관리</h1>
      <p className="text-gray-600 mb-8">고객 상담 내역을 등록하고 관리할 수 있습니다.</p>
      
      {/* 검색 및 추가 버튼 */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="고객명, 계좌번호, 제목으로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full md:w-80 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
        
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setFormData({
              customerName: '',
              customerAccount: '',
              date: '',
              title: '',
              content: ''
            });
            setShowForm(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          상담 내역 추가
        </button>
      </div>
      
      {/* 상담 내역 추가/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            {editingId ? '상담 내역 수정' : '상담 내역 추가'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                  고객명
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="customerAccount" className="block text-sm font-medium text-gray-700 mb-1">
                  계좌번호
                </label>
                <input
                  type="text"
                  id="customerAccount"
                  name="customerAccount"
                  value={formData.customerAccount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  상담 일자
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                상담 내용
              </label>
              <textarea
                id="content"
                name="content"
                rows={4}
                value={formData.content}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
                required
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {editingId ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 상담 내역 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  고객명
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  계좌번호
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상담 일자
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConsultations.length > 0 ? (
                filteredConsultations.map((consultation) => (
                  <tr key={consultation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {consultation.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consultation.customerAccount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consultation.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {consultation.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(consultation.id)}
                        className="text-gray-600 hover:text-gray-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(consultation.id)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 상담 내역이 없습니다.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 