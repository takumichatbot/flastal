'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import toast from 'react-hot-toast'; // Import toast

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// Offer Modal Component
function OfferModal({ floristId, onClose }) {
  const { user } = useAuth(); // Only need user from useAuth
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    // Check if user is logged in (user object exists)
    if (user) { 
      const fetchUserProjects = async () => {
        setLoadingProjects(true);
        try {
          // ★★★ Use correct endpoint and no token ★★★
          const res = await fetch(`${API_URL}/api/users/${user.id}/created-projects`); 
          if (!res.ok) throw new Error('企画の取得に失敗しました。');
          const data = await res.json();
          
          // Filter projects that can receive offers (e.g., FUNDRAISING or maybe SUCCESSFUL)
          // Adjust this filter based on your backend logic for when offers are allowed
          const offerableProjects = data.filter(p => p.status === 'FUNDRAISING' || p.status === 'SUCCESSFUL'); 
          setProjects(offerableProjects);

          if (offerableProjects.length === 0) {
            // Use toast for feedback instead of alert
            toast.error('オファーに出せる募集中または達成済みの企画がありません。'); 
          }
        } catch (error) {
          toast.error(error.message); // Use toast for errors
        } finally {
          setLoadingProjects(false);
        }
      };
      fetchUserProjects();
    } else {
        // If user is not logged in, no need to fetch projects
        setLoadingProjects(false);
    }
  }, [user]); // Dependency is only user
  
  const handleOfferSubmit = async () => {
    if (!selectedProjectId) {
      toast.error('オファーする企画を選択してください。'); // Use toast
      return;
    }
    if (!user) { // Ensure user is still logged in
        toast.error('ログインが必要です。');
        return;
    }
    
    // Use toast.promise
    const promise = fetch(`${API_URL}/api/offers`, {
      method: 'POST',
      headers: { 
          'Content-Type': 'application/json',
          // No Authorization header needed
      },
      body: JSON.stringify({
        // Ensure IDs are sent as strings if the backend expects them
        projectId: selectedProjectId, 
        floristId: floristId, 
      }),
    }).then(async (res) => {
      const data = await res.json();
      // Check for specific backend errors like P2002 (already offered)
      if (!res.ok) throw new Error(data.message || 'オファーの送信に失敗しました。'); 
      return data;
    });

    toast.promise(promise, {
        loading: 'オファーを送信中...',
        success: (data) => {
            onClose(); // Close modal on success
            return 'オファーを送信しました！お花屋さんからの連絡をお待ちください。';
        },
        error: (err) => err.message, // Show specific error (e.g., 'already offered')
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">企画をオファーする</h2>
        <div className="space-y-4">
          {loadingProjects ? <p className="text-gray-600">あなたの企画を読み込み中...</p> : 
           projects.length === 0 ? <p className="text-red-600">オファー可能な企画がありません。</p> : (
            <div>
              <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700 mb-1">オファーする企画を選択</label>
              <select 
                id="projectSelect"
                value={selectedProjectId} 
                onChange={(e) => setSelectedProjectId(e.target.value)} 
                className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md focus:border-pink-500 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
                required
              >
                <option value="">-- 企画を選択 --</option>
                {/* Ensure project has id and title */}
                {projects.map(p => <option key={p.id} value={p.id}>{p.title} ({p.status === 'FUNDRAISING' ? '募集中' : '達成済'})</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">キャンセル</button>
          <button 
            onClick={handleOfferSubmit} 
            className="px-4 py-2 font-bold text-white bg-green-500 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
            disabled={loadingProjects || projects.length === 0 || !selectedProjectId} // Disable if no project selected
          >
            オファーを送信
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function FloristDetailPage({ params }) {
  const { id } = params;
  const { user } = useAuth(); // Get user info (might be null)
  const [florist, setFlorist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchFlorist = async () => {
        setLoading(true); // Set loading true at the start
        try {
          const response = await fetch(`${API_URL}/api/florists/${id}`);
          if (!response.ok) throw new Error('お花屋さんが見つかりませんでした。');
          const data = await response.json();
           // Convert nulls to empty strings for display
          Object.keys(data).forEach(key => {
            if (data[key] === null) data[key] = '';
          });
          setFlorist(data);
        } catch (error) { 
            console.error(error); 
            toast.error(error.message); // Show error to user
        } finally { 
            setLoading(false); 
        }
      };
      fetchFlorist();
    }
  }, [id]);

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-pink-50">
              <p>読み込み中...</p>
          </div>
      );
  }
  if (!florist) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-pink-50">
              <p className="text-red-600">お花屋さんが見つかりませんでした。</p>
          </div>
      );
  }

  // Calculate average rating and count (if reviews exist)
  const reviews = florist.reviews || [];
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount 
    : 0;


  return (
    <>
      <div className="min-h-screen bg-pink-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
          {/* Display platformName (public name) */}
          <h1 className="text-4xl font-bold text-pink-800 mb-2">{florist.platformName}</h1> 
          <p className="text-lg text-gray-600 mb-6">担当者: {florist.contactName}</p>
          
          {/* Display Rating */}
           <div className="flex items-center gap-2 mb-6">
            {reviewCount > 0 ? (
              <>
                {/* Assuming StarRating component exists */}
                {/* <StarRating rating={averageRating} /> */} 
                <span className="font-semibold text-yellow-500">{averageRating.toFixed(1)} ★</span>
                <span className="text-sm text-gray-500">({reviewCount}件のレビュー)</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">レビューはまだありません</span>
            )}
          </div>

          <div className="border-t pt-6 mb-6">
             <h2 className="text-xl font-semibold text-gray-700 mb-4">店舗情報</h2>
             <div className="space-y-3 text-gray-800">
                {florist.address && <p><span className="font-semibold w-20 inline-block">住所:</span> {florist.address}</p>}
                {florist.phoneNumber && <p><span className="font-semibold w-20 inline-block">電話番号:</span> {florist.phoneNumber}</p>}
                {florist.website && 
                    <p><span className="font-semibold w-20 inline-block">Webサイト:</span> 
                        <a href={florist.website.startsWith('http') ? florist.website : `https://${florist.website}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline ml-2">
                            {florist.website}
                        </a>
                    </p>
                }
             </div>
          </div>

          {florist.portfolio && (
            <div className="border-t pt-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">ポートフォリオ・自己紹介</h2>
                <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{florist.portfolio}</p>
            </div>
          )}

          <div className="text-center border-t pt-8">
            {user ? ( // Check if ANY user is logged in
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="px-8 py-4 font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105 shadow-md"
              >
                このお花屋さんに企画をオファーする
              </button>
            ) : (
              <div className="p-4 bg-gray-100 rounded-lg inline-block">
                <p className="text-gray-700">企画をオファーするには、ログインしてください。</p>
                <Link href="/login">
                  <span className="mt-2 inline-block text-blue-500 hover:underline font-semibold">ログインページへ</span>
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* Reviews Section */}
        {reviews.length > 0 && (
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8 mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">レビュー ({reviewCount}件)</h2>
                <div className="space-y-6">
                    {reviews.map(review => (
                        <div key={review.id} className="border-b pb-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-gray-700">{review.user.handleName}</span>
                                {/* <StarRating rating={review.rating} /> */}
                                <span className="font-semibold text-yellow-500">{review.rating} ★</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                                企画名: <Link href={`/projects/${review.project.id}`}><span className="text-sky-600 hover:underline">{review.project.title}</span></Link>
                            </p>
                            {review.comment && <p className="text-gray-800 bg-gray-50 p-3 rounded">{review.comment}</p>}
                            <p className="text-xs text-gray-400 text-right mt-1">{new Date(review.createdAt).toLocaleDateString('ja-JP')}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
      
      {/* Ensure floristId is passed correctly */}
      {isModalOpen && <OfferModal floristId={id} onClose={() => setIsModalOpen(false)} />} 
    </>
  );
}