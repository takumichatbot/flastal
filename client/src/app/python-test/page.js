"use client";

import { useState, useEffect } from 'react';

// 各企画アイテムのコンポーネント
const ProjectItem = ({ project, fetchProjects }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [organizer, setOrganizer] = useState(project.organizer);

  const handleDelete = () => {
    if (!confirm('本当にこの企画を削除しますか？')) return;
    fetch(`http://127.0.0.1:8000/api/projects/${project.id}`, { method: 'DELETE' })
      .then(response => {
        if (!response.ok) throw new Error('Deletion failed');
        fetchProjects();
      })
      .catch(error => alert('削除に失敗しました。'));
  };

  const handleUpdate = () => {
    const updatedProject = { title, organizer };
    fetch(`http://127.0.0.1:8000/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject),
    })
    .then(response => {
      if (!response.ok) throw new Error('Update failed');
      return response.json();
    })
    .then(() => {
      setIsEditing(false);
      fetchProjects();
    })
    .catch(error => alert('更新に失敗しました。'));
  };

  return (
    <div className="border rounded-xl p-6 mb-4 shadow-sm bg-white transition-shadow hover:shadow-md">
      {isEditing ? (
        <div className="flex flex-col gap-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold p-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-0 transition" />
          <input type="text" value={organizer} onChange={(e) => setOrganizer(e.target.value)} className="p-3 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:ring-0 transition" />
          <div className="flex gap-2 mt-2">
            <button onClick={handleUpdate} className="bg-sky-500 text-white px-5 py-2 rounded-lg hover:bg-sky-600 transition-colors font-semibold">保存</button>
            <button onClick={() => setIsEditing(false)} className="bg-gray-200 px-5 py-2 rounded-lg hover:bg-gray-300 transition-colors">キャンセル</button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{project.title}</h2>
            <p className="text-gray-600 mt-1">企画者: {project.organizer}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(true)} className="bg-white text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors border">編集</button>
            <button onClick={handleDelete} className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition-colors">削除</button>
          </div>
        </div>
      )}
    </div>
  );
};


// ページ全体のコンポーネント
export default function PythonTestPage() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newOrganizer, setNewOrganizer] = useState('');

  const fetchProjects = () => {
    setIsLoading(true);
    fetch('http://127.0.0.1:8000/api/projects')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        setProjects(data);
        setIsLoading(false);
      })
      .catch(error => {
        setError('企画データの取得に失敗しました。');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    const newProject = { title: newTitle, organizer: newOrganizer };
    fetch('http://127.0.0.1:8000/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject),
    })
    .then(response => response.json())
    .then(() => {
      fetchProjects();
      setNewTitle('');
      setNewOrganizer('');
    })
    .catch(error => alert('作成に失敗しました。'));
  };

  return (
    <div className="bg-sky-50 min-h-screen font-sans">
      <div className="max-w-3xl mx-auto p-4 sm:p-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-sky-600">企画管理</h1>
          <p className="text-gray-500 mt-4 text-lg">新しい企画を作成し、管理します。</p>
        </header>

        <section className="bg-white p-8 border rounded-xl shadow-md mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">新しい企画を作成</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="font-semibold text-gray-700">企画タイトル:</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition"
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700">企画者:</label>
              <input
                type="text"
                value={newOrganizer}
                onChange={(e) => setNewOrganizer(e.target.value)}
                required
                className="w-full p-3 border-2 border-gray-200 rounded-lg mt-2 focus:border-sky-500 focus:ring-0 transition"
              />
            </div>
            <button type="submit" className="w-full p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-lg font-semibold mt-4">
              作成する
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">企画リスト</h2>
          <div className="flex flex-col gap-4">
            {isLoading ? <p className="text-center">Loading...</p> : projects.map(project => (
              <ProjectItem key={project.id} project={project} fetchProjects={fetchProjects} />
            ))}
            {error && <p className="text-center text-red-500">{error}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}