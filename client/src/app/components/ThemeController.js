"use client";

import { useEffect } from 'react';

export default function ThemeController() {
  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1; // 1月=0 なので +1
    const body = document.body;

    // 一旦すべての季節クラスを削除
    body.classList.remove('theme-spring', 'theme-summer', 'theme-autumn', 'theme-winter');

    // 月によってクラスを付与
    if (currentMonth >= 3 && currentMonth <= 5) {
      body.classList.add('theme-spring');
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      body.classList.add('theme-summer');
    } else if (currentMonth >= 9 && currentMonth <= 11) {
      body.classList.add('theme-autumn');
    } else {
      body.classList.add('theme-winter'); // 12, 1, 2月
    }
  }, []);

  // 画面には何も表示しない機能だけのコンポーネント
  return null;
}