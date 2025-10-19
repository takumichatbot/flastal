'use client';
import { useState, useEffect } from 'react';
import ProjectCard from './ProjectCard';
import SkeletonCard from './SkeletonCard'; 

// ★ API_URL corrected
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true); 
      try {
        const res = await fetch(`${API_URL}/api/projects/featured`);
        if(res.ok) {
          const data = await res.json();
          // Ensure data is an array
          setProjects(Array.isArray(data) ? data : []); 
        } else {
            console.error("Failed to fetch featured projects, status:", res.status);
            setProjects([]); // Set empty on error
        }
      } catch (error) {
        console.error("Failed to fetch featured projects:", error);
        setProjects([]); // Set empty on error
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Show skeleton cards while loading
  if (loading) {
    return (
      <div className="bg-white w-full py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Skeleton for title */}
          <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto mb-16 animate-pulse"></div> 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  // Don't render section if no projects after loading
  if (projects.length === 0) {
    return null; 
  }

  // Render projects once loaded
  return (
    <div className="bg-white w-full py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-center mb-16">
          注目の企画
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {projects.map(project => (
            // Ensure project has an id before rendering
            project && project.id ? <ProjectCard key={project.id} project={project} /> : null 
          ))}
        </div>
      </div>
    </div>
  );
}