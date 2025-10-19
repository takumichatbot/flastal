'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// Assuming StarRating component exists at this path
// import StarRating from '../components/StarRating'; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// Florist Card Component
function FloristCard({ florist }) {
  // Check if reviews exist and calculate rating/count if needed locally,
  // OR rely on backend to provide aggregated data.
  // For now, let's assume the basic data is available.
  const reviewCount = florist.reviews?.length || 0; // Example if reviews array is included
  const averageRating = reviewCount > 0
    ? florist.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  return (
    // Use legacyBehavior for Link wrapping a custom component/div acting as <a>
    <Link href={`/florists/${florist.id}`} legacyBehavior> 
      <a className="bg-white rounded-2xl shadow-lg overflow-hidden h-full flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <div className="bg-gradient-to-br from-pink-100 to-rose-200 h-32 flex items-center justify-center">
          <span className="text-4xl">💐</span>
        </div>
        <div className="p-6 flex flex-col flex-grow">
          {/* ★★★ Display platformName (public name) ★★★ */}
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-pink-600 transition-colors mb-2 truncate">{florist.platformName}</h3>
          {/* Optionally show contact name if desired, or remove */}
          {/* <p className="text-sm text-gray-600 mb-4">担当者: {florist.contactName}</p> */} 
          
          {/* Rating Display */}
          <div className="mt-auto flex items-center gap-2">
            {/* ★ Simplified rating display until backend provides aggregated data */}
             {reviewCount > 0 ? (
              <>
                {/* <StarRating rating={averageRating} /> */}
                 <span className="font-semibold text-yellow-500">{averageRating.toFixed(1)} ★</span>
                <span className="text-xs text-gray-500">({reviewCount}件)</span>
              </>
            ) : (
              <span className="text-xs text-gray-500">レビューはまだありません</span>
            )}
          </div>
        </div>
      </a>
    </Link>
  );
}

// Florist List Page
export default function FloristsPage() {
  const [florists, setFlorists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlorists = async () => {
      setLoading(true); // Ensure loading is true at start
      try {
        const response = await fetch(`${API_URL}/api/florists`);
        if (!response.ok) throw new Error('データの取得に失敗しました。');
        const data = await response.json();
        // Ensure data is an array before setting state
        setFlorists(Array.isArray(data) ? data : []); 
      } catch (error) { 
          console.error(error); 
          toast.error(error.message); // Show error to user
          setFlorists([]); // Set empty array on error
      } finally { 
          setLoading(false); 
      }
    };
    fetchFlorists();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <main>
        {/* Header Section */}
        <div className="relative w-full bg-pink-50">
           <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
             <h1 className="text-3xl font-bold text-gray-900">お花屋さんを探す</h1>
             <p className="mt-2 text-gray-600">あなたの想いを形にしてくれる、素敵なお花屋さんを見つけましょう。</p>
           </div>
        </div>
        
        {/* Florist Grid Section */}
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          {loading ? (
              <p className="text-center text-gray-600">お花屋さんを読み込んでいます...</p>
          ) : florists.length === 0 ? (
              <p className="text-center text-gray-600">現在登録されているお花屋さんはありません。</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {florists.map((florist) => (
                // Ensure florist object has necessary properties (id, platformName, reviews...)
                florist && florist.id ? <FloristCard key={florist.id} florist={florist} /> : null
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}