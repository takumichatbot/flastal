'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FiTwitter, FiInstagram, FiHeart, FiAward } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

// 企画カード (ギャラリー用)
function GalleryCard({ project, label }) {
    return (
        <Link href={`/projects/${project.id}`} className="block group">
            <div className="relative aspect-square bg-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                {project.imageUrl ? (
                    <img src={project.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white text-xs font-bold line-clamp-2">{project.title}</p>
                    <span className="text-[10px] text-white/80">{label}</span>
                </div>
            </div>
        </Link>
    );
}

export default function PublicUserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${id}/profile`);
        if (!res.ok) throw new Error(res.status === 403 ? 'このプロフィールは非公開です' : 'ユーザーが見つかりません');
        setProfile(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-500"></div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-gray-500">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ヘッダー画像 (仮: プロフィールの背景画像があればそれを使うが、今回は固定) */}
      <div className="h-48 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-20 pb-20">
        
        {/* プロフィールカード */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            <div className="flex-shrink-0">
                {profile.iconUrl ? (
                    <img src={profile.iconUrl} className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover"/>
                ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-md flex items-center justify-center text-3xl">👤</div>
                )}
            </div>
            
            <div className="flex-grow">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{profile.handleName}</h1>
                
                {/* ジャンルタグ */}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                    {profile.favoriteGenres?.map(g => (
                        <span key={g} className="px-3 py-1 bg-pink-50 text-pink-600 text-xs font-bold rounded-full border border-pink-100">
                            #{g}
                        </span>
                    ))}
                </div>

                <p className="text-gray-600 whitespace-pre-wrap mb-6 text-sm leading-relaxed">
                    {profile.bio || '自己紹介はまだ設定されていません。'}
                </p>

                {/* SNSリンク */}
                <div className="flex justify-center md:justify-start gap-4">
                    {profile.twitterUrl && (
                        <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-colors">
                            <FiTwitter size={24}/>
                        </a>
                    )}
                    {profile.instagramUrl && (
                        <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E1306C] transition-colors">
                            <FiInstagram size={24}/>
                        </a>
                    )}
                </div>
            </div>
        </div>

        {/* ギャラリーセクション */}
        <div className="mt-12">
            <div className="flex items-center gap-2 mb-6">
                <FiAward className="text-yellow-500 text-xl"/>
                <h2 className="text-xl font-bold text-gray-800">主催した企画</h2>
            </div>
            {profile.createdProjects.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {profile.createdProjects.map(p => <GalleryCard key={p.id} project={p} label="Organizer" />)}
                </div>
            ) : (
                <p className="text-gray-500 text-sm">まだ主催した企画はありません。</p>
            )}
        </div>

        <div className="mt-12">
            <div className="flex items-center gap-2 mb-6">
                <FiHeart className="text-pink-500 text-xl"/>
                <h2 className="text-xl font-bold text-gray-800">参加した企画 (Archive)</h2>
            </div>
            {profile.pledges.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {profile.pledges.map(pledge => <GalleryCard key={pledge.project.id} project={pledge.project} label="Supporter" />)}
                </div>
            ) : (
                <p className="text-gray-500 text-sm">参加履歴は公開されていません。</p>
            )}
        </div>

      </div>
    </div>
  );
}