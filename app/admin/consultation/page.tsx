'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Search, Edit, Trash, Loader2, X, Check, User, ChevronRight, Eye } from 'lucide-react';
import QuillEditor from '@/components/quill-editor';
import FileUploader from '@/components/file-uploader';
import FileViewer from '@/components/file-viewer';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { toast, Toaster } from 'react-hot-toast';

// 상담 내역 타입 정의
interface Consultation {
  id: string;
  user_id: string;
  title: string;
  content: string;
  consultation_date: string;
  created_at: string;
  updated_at?: string;
  users?: {
    name: string;
    email: string;
    account_number: string;
    phone?: string;
  };
  consultation_attachments?: {
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
  }[];
  reference_url?: string;
}

// 고객 타입 정의
interface Customer {
  id: string;
  name: string;
  email?: string;
  account_number?: string;
  phone?: string;
}

// 타입 선언 추가
declare global {
  interface Window {
    searchTimeout: NodeJS.Timeout | null;
  }
}

// FormData 인터페이스 정의
interface FormData {
  id: string;
  user_id: string;
  title: string;
  content: string;
  consultation_date: string;
  reference_url?: string; // 추가: 링크 URL 필드
  customer: {
    name: string;
    email: string;
    account_number: string;
    phone: string;
  };
}

export default function ConsultationAdmin() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    id: '',
    user_id: '',
    title: '',
    content: '',
    consultation_date: '',
    reference_url: '', // URL 필드 유지
    customer: {
      name: '',
      email: '',
      account_number: '',
      phone: ''
    }
  });
  
  // 파일 업로드 관련 상태 제거
  // const [files, setFiles] = useState<File[]>([]);
  // const [attachments, setAttachments] = useState<any[]>([]);
  // const [uploading, setUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // 페이지네이션 상태
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // 고객 검색 관련 상태
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const customerSearchRef = useRef<HTMLDivElement>(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // 상세보기 관련 상태 추가
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 상담 내역 및 고객 데이터 로드
  useEffect(() => {
    fetchConsultations();
    fetchCustomers();
  }, [page]);

  // 상담 내역 목록 조회
  const fetchConsultations = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      // 필터 파라미터 구성
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/consultations?${params.toString()}`);
      const result = await response.json();
      
      if (response.ok) {
        setConsultations(result.data);
        setTotalPages(result.pagination.totalPages);
        setPage(page);
      } else {
        setError(result.error || '상담 내역을 불러오는 중 오류가 발생했습니다.');
        toast.error('상담 내역을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('상담 내역 조회 오류:', err);
      setError('상담 내역을 불러오는 중 오류가 발생했습니다.');
      toast.error('상담 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 고객 데이터 가져오기
  const fetchCustomers = async (searchTerm = '') => {
    console.log('Fetching customers with search term:', searchTerm);
    setIsLoadingCustomers(true);
    
    try {
      // API 엔드포인트를 통한 검색
      console.log('API 호출로 고객 검색 시도');
      const response = await fetch(`/api/users?search=${encodeURIComponent(searchTerm)}&page=1&limit=20`);
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Search results data structure:', data);
      
      if (data && Array.isArray(data.users) && data.users.length > 0) {
        console.log('Found users from API:', data.users.length);
        
        // 클라이언트 측에서도 중복 제거 (이름과 전화번호가 같은 사용자는 한 번만 표시)
        const uniqueKeys = new Set<string>();
        const uniqueUsers = data.users.filter((user: any) => {
          const key = `${user.name}|${user.phone || ''}`;
          if (uniqueKeys.has(key)) return false;
          uniqueKeys.add(key);
          return true;
        });
        
        console.log('Unique users after client-side filtering:', uniqueUsers.length);
        setFilteredCustomers(uniqueUsers);
        setIsLoadingCustomers(false);
        return;
      }
      
      // API에서 결과가 없으면 Supabase 직접 쿼리 시도
      console.log('API에서 결과가 없어 Supabase 직접 쿼리 시도');
      const { data: supabaseData, error: supabaseError } = await supabase
        .from('users')
        .select('id, name, phone')
        .order('name');
      
      if (searchTerm) {
        // 이름이나 전화번호로 필터링
        let filteredData = supabaseData?.filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (user.phone && user.phone.includes(searchTerm))
        ) || [];
        
        // 중복 제거
        const uniqueKeys = new Set<string>();
        filteredData = filteredData.filter(user => {
          const key = `${user.name}|${user.phone || ''}`;
          if (uniqueKeys.has(key)) return false;
          uniqueKeys.add(key);
          return true;
        });
        
        console.log('Supabase 직접 필터링 결과(중복 제거 후):', filteredData.length);
        setFilteredCustomers(filteredData.slice(0, 20));
      } else {
        // 전체 결과에서도 중복 제거
        const uniqueKeys = new Set<string>();
        const uniqueData = supabaseData?.filter(user => {
          const key = `${user.name}|${user.phone || ''}`;
          if (uniqueKeys.has(key)) return false;
          uniqueKeys.add(key);
          return true;
        }) || [];
        
        console.log('Supabase 전체 결과(중복 제거 후):', uniqueData.length);
        setFilteredCustomers(uniqueData.slice(0, 20));
      }
    } catch (error) {
      console.error('Customer search error:', error);
      
      // 모든 시도가 실패하면 빈 결과 반환
      setFilteredCustomers([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // 고객 검색 처리
  const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setCustomerSearchTerm(term);
    console.log('Customer search term changed:', term);
    
    // 검색어가 없으면 기본 고객 목록 표시
    if (!term.trim()) {
      console.log('Empty search term, showing default customer list');
      // 기본 고객 목록 표시
      setFilteredCustomers(customers);
      return;
    }
    
    // 디바운스 처리
    if (typeof window !== 'undefined') {
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
      
      // 검색어가 있으면 디바운스 적용
      console.log('Setting up debounce for search term:', term);
      window.searchTimeout = setTimeout(() => {
        console.log('Debounce timeout completed, executing search for:', term);
        fetchCustomers(term);
      }, 300);
    } else {
      // 서버 사이드에서는 즉시 실행
      console.log('Server-side search execution');
      fetchCustomers(term);
    }
  };

  // 고객 검색 결과 필터링 (로컬 필터링)
  const filterCustomers = (term: string) => {
    if (!term.trim()) {
      return customers.slice(0, 20); // 검색어가 없으면 최대 20개만 표시
    }
    
    const lowerTerm = term.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(lowerTerm) ||
      (customer.phone && customer.phone.includes(lowerTerm))
    ).slice(0, 20); // 최대 20개만 표시
  };

  // 외부 클릭 시 고객 검색 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 고객 선택 처리
  const handleSelectCustomer = (customer: Customer) => {
    console.log('선택된 고객:', customer);
    
    // 고객 ID 유효성 검증
    fetch(`/api/user/check?id=${customer.id}`)
      .then(response => response.json())
      .then(data => {
        if (data.exists) {
          console.log('유효한 사용자 ID 확인됨:', customer.id, '사용자 정보:', data.user);
          setFormData(prev => ({
            ...prev,
            user_id: customer.id,
            customer: {
              name: customer.name || '',
              email: customer.email || '',
              account_number: customer.account_number || '',
              phone: customer.phone || ''
            }
          }));
          setShowCustomerSearch(false);
          setCustomerSearchTerm('');
          toast.success(`${customer.name} 고객이 선택되었습니다.`);
        } else {
          console.error('유효하지 않은 사용자 ID:', customer.id, data);
          
          // 이메일로 추가 확인 시도
          if (customer.email) {
            console.log('이메일로 사용자 확인 시도:', customer.email);
            fetch(`/api/user/check?email=${encodeURIComponent(customer.email)}`)
              .then(response => response.json())
              .then(emailData => {
                if (emailData.exists && emailData.user) {
                  console.log('이메일로 유효한 사용자 ID 찾음:', emailData.user.id);
                  setFormData(prev => ({
                    ...prev,
                    user_id: emailData.user.id,
                    customer: {
                      name: customer.name || '',
                      email: customer.email || '',
                      account_number: customer.account_number || '',
                      phone: customer.phone || ''
                    }
                  }));
                  setShowCustomerSearch(false);
                  setCustomerSearchTerm('');
                  toast.success(`${customer.name} 고객이 선택되었습니다.`);
                } else {
                  toast.error('선택한 고객 정보가 유효하지 않습니다. 다른 고객을 선택해주세요.');
                }
              })
              .catch(emailError => {
                console.error('이메일 검증 오류:', emailError);
                toast.error('고객 정보 확인 중 오류가 발생했습니다.');
              });
          } else {
            toast.error('선택한 고객 정보가 유효하지 않습니다. 다른 고객을 선택해주세요.');
          }
        }
      })
      .catch(error => {
        console.error('고객 ID 검증 오류:', error);
        toast.error('고객 정보 확인 중 오류가 발생했습니다.');
      });
  };

  // 선택된 고객 초기화 함수
  const clearSelectedCustomer = () => {
    setFormData(prev => ({
      ...prev,
      user_id: '',
      customer: { name: '', email: '', account_number: '', phone: '' }
    }));
    setCustomerSearchTerm('');
    setShowCustomerSearch(true);
  };

  // 검색된 상담 내역
  const filteredConsultations = searchTerm 
    ? consultations.filter(consultation => 
        (consultation.users?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        consultation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : consultations;

  // 입력 필드 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 리치 텍스트 에디터 변경 핸들러
  const handleContentChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      content: value
    }));
  };

  // 상담 내역 저장
  const saveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id) {
      toast.error('고객을 선택해주세요.');
      return;
    }

    // 사용자 ID 유효성 검증 추가
    try {
      console.log('사용자 ID 유효성 검증 시작:', formData.user_id);
      const userCheckResponse = await fetch(`/api/user/check?id=${formData.user_id}`);
      const userCheckResult = await userCheckResponse.json();
      
      if (!userCheckResponse.ok || !userCheckResult.exists) {
        console.error('사용자 ID 유효성 검증 실패:', userCheckResult);
        toast.error('선택한 사용자가 데이터베이스에 존재하지 않습니다. 다른 사용자를 선택해주세요.');
        return;
      }
      
      console.log('사용자 ID 유효성 검증 성공:', userCheckResult);
    } catch (error) {
      console.error('사용자 ID 검증 중 오류:', error);
      toast.error('사용자 정보 확인 중 오류가 발생했습니다.');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }

    if (!formData.consultation_date) {
      toast.error('상담 날짜를 선택해주세요.');
      return;
    }

    setUploading(true);

    try {
      // 디버깅: 전송할 데이터 확인
      console.log('저장할 상담 내역 데이터:', {
        user_id: formData.user_id,
        title: formData.title,
        content: formData.content.substring(0, 100) + (formData.content.length > 100 ? '...' : ''),
        consultation_date: formData.consultation_date,
        reference_url: formData.reference_url
      });
      
      // 1. 상담 내역 저장
      let consultationId = formData.id;
      let consultationResponse;
      
      if (editingId) {
        // 수정 모드
        console.log('상담 내역 수정 요청:', editingId);
        try {
          const requestBody = {
            user_id: formData.user_id,
            title: formData.title,
            content: formData.content,
            consultation_date: formData.consultation_date,
            reference_url: formData.reference_url
          };
          
          console.log('요청 본문:', JSON.stringify(requestBody));
          
          consultationResponse = await fetch(`/api/consultations/${editingId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
        } catch (fetchError) {
          console.error('Fetch 오류:', fetchError);
          throw new Error(`API 요청 중 오류가 발생했습니다: ${fetchError instanceof Error ? fetchError.message : '알 수 없는 오류'}`);
        }
      } else {
        // 추가 모드
        console.log('새 상담 내역 추가 요청');
        try {
          const requestBody = {
            user_id: formData.user_id,
            title: formData.title,
            content: formData.content,
            consultation_date: formData.consultation_date,
            reference_url: formData.reference_url
          };
          
          console.log('요청 본문:', JSON.stringify(requestBody));
          
          consultationResponse = await fetch('/api/consultations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });
        } catch (fetchError) {
          console.error('Fetch 오류:', fetchError);
          throw new Error(`API 요청 중 오류가 발생했습니다: ${fetchError instanceof Error ? fetchError.message : '알 수 없는 오류'}`);
        }
      }
      
      console.log('API 응답 상태:', consultationResponse.status);
      
      if (!consultationResponse.ok) {
        const errorText = await consultationResponse.text();
        console.error('API 응답 에러:', errorText);
        throw new Error(`상담 내역 저장 중 오류가 발생했습니다: ${consultationResponse.status} ${errorText}`);
      }
      
      const result = await consultationResponse.json();
      console.log('상담 내역 저장 응답:', result);
      
      if (result.data) {
        consultationId = result.data.id;
        console.log('저장된 상담 내역 ID:', consultationId);
      } else {
        console.warn('응답에 data 필드가 없습니다:', result);
      }
      
      // 성공 메시지 표시
      toast.success(editingId ? '상담 내역이 수정되었습니다.' : '상담 내역이 추가되었습니다.');
      
      // 폼 초기화 및 목록 새로고침
      resetForm();
      fetchConsultations();
      setShowForm(false);
    } catch (error) {
      console.error('상담 내역 저장 오류:', error);
      toast.error(error instanceof Error ? error.message : '상담 내역 저장 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 폼 초기화
  const resetForm = () => {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 변환
    const today = new Date().toISOString().split('T')[0];
    
    setFormData({
      id: '',
      user_id: '',
      title: '',
      content: '',
      consultation_date: today,
      reference_url: '', // URL 필드 초기화
      customer: {
        name: '',
        email: '',
        account_number: '',
        phone: ''
      }
    });
    // setFiles([]); // 파일 관련 상태 초기화 제거
    setEditingId(null);
    setShowForm(false);
  };

  // 상담 내역 수정 핸들러
  const handleEdit = async (id: string) => {
    try {
      setLoading(true);
      
      // 상담 내역 상세 조회
      const response = await fetch(`/api/consultations/${id}`);
      const result = await response.json();
      
      if (!response.ok || !result.data) {
        throw new Error('상담 내역을 불러오는 중 오류가 발생했습니다.');
      }
      
      const consultation = result.data;
      
      setFormData({
        id: consultation.id,
        user_id: consultation.user_id,
        title: consultation.title,
        content: consultation.content,
        consultation_date: consultation.consultation_date,
        reference_url: consultation.reference_url || '', // 참조 URL 로드
        customer: {
          name: consultation.users?.name || '',
          email: consultation.users?.email || '',
          account_number: consultation.users?.account_number || '',
          phone: consultation.users?.phone || ''
        }
      });
      
      // 첨부 파일 처리 코드 제거
      
      setEditingId(id);
      setShowForm(true);
    } catch (error) {
      console.error('상담 내역 상세 조회 오류:', error);
      toast.error('상담 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 상담 내역 삭제 핸들러
  const handleDelete = async (id: string) => {
    if (window.confirm('정말로 이 상담 내역을 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/consultations/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('상담 내역 삭제 중 오류가 발생했습니다.');
        }
        
        // 상담 내역 다시 로드
        await fetchConsultations();
      } catch (err) {
        console.error('상담 내역 삭제 오류:', err);
        setError('상담 내역 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 상담 내역 상세보기 핸들러
  const handleViewDetail = async (consultation: Consultation) => {
    console.log('상세보기 호출:', consultation);
    
    try {
      // 이미 모든 정보가 있다면 바로 표시
      if (consultation.users && consultation.consultation_attachments) {
        setSelectedConsultation(consultation);
        setShowDetailModal(true);
        return;
      }
      
      // 필요한 경우 상세 정보 추가 로드
      setLoading(true);
      const response = await fetch(`/api/consultations/${consultation.id}`);
      const result = await response.json();
      
      if (!response.ok || !result.data) {
        throw new Error('상담 내역을 불러오는 중 오류가 발생했습니다.');
      }
      
      setSelectedConsultation(result.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('상담 내역 상세 조회 오류:', error);
      toast.error('상담 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 초기 설정
  useEffect(() => {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 변환
    const today = new Date().toISOString().split('T')[0];
    
    // 초기 폼 데이터 설정
    setFormData(prev => ({
      ...prev,
      consultation_date: today
    }));
    
    // 페이지 로드 시 기본 고객 목록 가져오기
    const loadInitialCustomers = async () => {
      try {
        console.log('Loading initial customer list');
        setIsLoadingCustomers(true);
        
        // Supabase에서 고객 목록 가져오기
        const { data, error } = await supabase
          .from('users')
          .select('id, name, phone')
          .order('name')
          .limit(50); // 더 많은 고객을 로드
        
        if (error) {
          throw error;
        }
        
        console.log('초기 고객 목록 로드(중복 제거 전):', data?.length || 0);
        
        if (data && data.length > 0) {
          // 중복 제거 - 이름과 전화번호가 같은 사용자는 한 번만 표시
          const uniqueKeys = new Set<string>();
          const uniqueCustomers = data.filter((user: any) => {
            const key = `${user.name}|${user.phone || ''}`;
            if (uniqueKeys.has(key)) return false;
            uniqueKeys.add(key);
            return true;
          });
          
          console.log('초기 고객 목록 로드(중복 제거 후):', uniqueCustomers.length);
          setCustomers(uniqueCustomers);
          // 초기 필터링된 고객 목록도 설정
          setFilteredCustomers(uniqueCustomers.slice(0, 20));
        } else {
          console.log('No customers found in database');
          setCustomers([]);
          setFilteredCustomers([]);
        }
      } catch (error) {
        console.error('초기 고객 목록 로드 오류:', error);
        
        // API를 통해 고객 목록 가져오기 시도
        try {
          const response = await fetch('/api/users?limit=50');
          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.users)) {
              console.log('Loaded customers from API(중복 제거 전):', data.users.length);
              
              // 중복 제거
              const uniqueKeys = new Set<string>();
              const uniqueCustomers = data.users.filter((user: any) => {
                const key = `${user.name}|${user.phone || ''}`;
                if (uniqueKeys.has(key)) return false;
                uniqueKeys.add(key);
                return true;
              });
              
              console.log('Loaded customers from API(중복 제거 후):', uniqueCustomers.length);
              setCustomers(uniqueCustomers);
              setFilteredCustomers(uniqueCustomers.slice(0, 20));
            }
          }
        } catch (apiError) {
          console.error('API를 통한 고객 목록 로드 오류:', apiError);
        }
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    
    loadInitialCustomers();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <Toaster position="top-right" />
      <div className="flex items-center mb-6">
        <Link href="/admin" className="mr-4">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">상담 내역 관리</h1>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* 검색 및 추가 버튼 */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="고객명 또는 내용 검색..."
            className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          disabled={loading}
        >
          <Plus className="h-5 w-5 mr-2" />
          새 상담 내역 추가
        </button>
      </div>

      {/* 상담 내역 목록 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계좌번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">참조 링크</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                  </td>
                </tr>
              ) : filteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 상담 내역이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredConsultations.map((consultation) => (
                  <tr key={consultation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(consultation.consultation_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {consultation.users?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consultation.users?.account_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {consultation.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {consultation.reference_url ? (
                        <a 
                          href={consultation.reference_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          자세히 보기
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetail(consultation)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={loading}
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(consultation.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={loading}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(consultation.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={loading}
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1 || loading}
                className={`px-3 py-1 rounded ${
                  page === 1 || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                이전
              </button>
              <div className="px-3 py-1 text-gray-700">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages || loading}
                className={`px-3 py-1 rounded ${
                  page === totalPages || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 상담 내역 추가/수정 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">
                {editingId ? '상담 내역 수정' : '새 상담 내역 추가'}
              </h2>
              <button 
                onClick={resetForm}
                className="text-gray-700 hover:text-red-700"
                disabled={uploading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={saveConsultation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* 고객 선택 - 검색 기능이 있는 컴포넌트로 변경 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-1">고객 선택</label>
                  <div className="relative" ref={customerSearchRef}>
                    <div 
                      className={`flex items-center border rounded-md ${
                        formData.user_id ? 'bg-white border-gray-300' : 'bg-white border-gray-300'
                      } ${showCustomerSearch ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
                    >
                      <div className="flex-1 p-2">
                        {formData.user_id ? (
                          <div className="flex items-center">
                            <User className="h-5 w-5 text-blue-600 mr-2" />
                            <div>
                              <div className="font-medium text-black">{formData.customer.name}</div>
                              {formData.customer && formData.customer.phone && (
                                <div className="text-sm text-gray-700">
                                  {formData.customer.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <Search className="h-5 w-5 text-blue-600 mr-2" />
                            <input
                              type="text"
                              value={customerSearchTerm}
                              onChange={handleCustomerSearch}
                              onFocus={() => {
                                setShowCustomerSearch(true);
                                // 포커스 시 기본 고객 목록 표시
                                if (!customerSearchTerm.trim() && customers.length > 0) {
                                  setFilteredCustomers(customers.slice(0, 20));
                                }
                              }}
                              placeholder="고객명 또는 전화번호로 검색"
                              className="w-full outline-none text-black"
                              disabled={uploading}
                            />
                          </div>
                        )}
                      </div>
                      
                      {formData.user_id && (
                        <button
                          type="button"
                          onClick={clearSelectedCustomer}
                          className="p-2 text-gray-500 hover:text-red-600"
                          disabled={uploading}
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    {showCustomerSearch && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-y-auto">
                        <div className="p-2 border-b">
                          <div className="flex items-center bg-gray-50 border rounded-md">
                            <Search className="h-4 w-4 text-gray-500 ml-2" />
                            <input
                              type="text"
                              value={customerSearchTerm}
                              onChange={handleCustomerSearch}
                              placeholder="고객명 또는 전화번호로 검색"
                              className="w-full border-0 bg-transparent px-2 py-1.5 text-black focus:outline-none focus:ring-0"
                              autoFocus
                            />
                          </div>
                        </div>
                        
                        {isLoadingCustomers ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-2" />
                            <span className="text-gray-700">검색 중...</span>
                          </div>
                        ) : filteredCustomers.length > 0 ? (
                          <ul className="py-1">
                            {filteredCustomers.map((customer) => (
                              <li
                                key={customer.id}
                                onClick={() => handleSelectCustomer(customer)}
                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer flex justify-between items-center"
                              >
                                <div>
                                  <div className="font-medium text-black">{customer.name}</div>
                                  {customer.phone && (
                                    <div className="text-sm text-gray-700">
                                      {customer.phone}
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-4 text-center text-gray-700">
                            {customerSearchTerm.trim() ? '검색 결과가 없습니다. 다른 검색어를 시도해보세요.' : '검색어를 입력하세요.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!formData.user_id && !editingId && (
                    <p className="mt-1 text-sm text-red-500">고객을 선택해주세요</p>
                  )}
                </div>
                
                {/* 상담 날짜 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-1">상담 날짜</label>
                  <input
                    type="date"
                    name="consultation_date"
                    value={formData.consultation_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    required
                    disabled={uploading}
                  />
                </div>
                
                {/* 제목 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-1">제목</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    required
                    disabled={uploading}
                  />
                </div>
                
                {/* 내용 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-1">상담 내용</label>
                  {/* Quill 에디터로 대체 */}
                  <div className="quill-editor-wrapper">
                    <QuillEditor 
                      value={formData.content}
                      onChange={handleContentChange}
                      placeholder="상담 내용을 입력하세요..."
                    />
                  </div>
                  <style jsx>{`
                    .quill-editor-wrapper {
                      border-radius: 0.375rem;
                      overflow: hidden;
                      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                    }
                  `}</style>
                </div>
                
                {/* 자세히 보기 링크 추가 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    자세히 보기 링크
                  </label>
                  <input
                    type="url"
                    name="reference_url"
                    value={formData.reference_url || ''}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    placeholder="https://example.com"
                    disabled={uploading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    링크를 추가하면 상담 내역에 '자세히 보기' 버튼이 표시됩니다
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-800 hover:bg-gray-50"
                  disabled={uploading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  disabled={uploading || !formData.user_id}
                >
                  {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? '수정 완료' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상담 내역 상세보기 모달 */}
      {showDetailModal && selectedConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-black">상담 내역 상세보기</h2>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-700 hover:text-red-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* 고객 정보 섹션 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3">고객 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">고객명</p>
                    <p className="text-black font-medium">{selectedConsultation.users?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">계좌번호</p>
                    <p className="text-black">{selectedConsultation.users?.account_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">이메일</p>
                    <p className="text-black">{selectedConsultation.users?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">연락처</p>
                    <p className="text-black">{selectedConsultation.users?.phone || '-'}</p>
                  </div>
                </div>
              </div>
              
              {/* 상담 정보 섹션 */}
              <div>
                <div className="flex justify-between mb-3">
                  <h3 className="text-md font-semibold text-gray-800">상담 정보</h3>
                  <p className="text-sm text-gray-600">
                    상담일: {formatDate(selectedConsultation.consultation_date)}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-black">{selectedConsultation.title}</h4>
                </div>
                
                <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedConsultation.content }}
                  />
                </div>
                
                {/* 참조 링크 */}
                {selectedConsultation.reference_url && (
                  <div className="mt-4">
                    <h3 className="text-md font-semibold text-gray-800 mb-2">참조 링크</h3>
                    <a
                      href={selectedConsultation.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      {selectedConsultation.reference_url}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
              
              {/* 작성/수정 정보 */}
              <div className="border-t pt-4 text-sm text-gray-500">
                <p>작성일: {formatDate(selectedConsultation.created_at)}</p>
                {selectedConsultation.updated_at && selectedConsultation.updated_at !== selectedConsultation.created_at && (
                  <p>최종 수정일: {formatDate(selectedConsultation.updated_at)}</p>
                )}
              </div>
              
              {/* 하단 버튼 */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => handleEdit(selectedConsultation.id)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  수정하기
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-800 hover:bg-gray-50"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 