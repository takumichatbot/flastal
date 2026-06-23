'use client';

import React from 'react';

/**
 * テキスト内の検索キーワードをハイライト表示用の JSX に変換する
 * @param {string} text - 元のテキスト
 * @param {string} query - 検索キーワード
 * @returns {React.ReactNode}
 */
export function highlightText(text, query) {
  if (!query || !text) return text;

  try {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-yellow-200 text-yellow-900 rounded px-0.5 not-italic"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  } catch {
    return text;
  }
}

/**
 * Typesense の _highlight フィールド（<mark>xxx</mark> 形式）を HTML としてレンダリングするコンポーネント
 * @param {string} value - Typesense が返すハイライト済み文字列
 */
export function TypesenseHighlight({ value }) {
  if (!value) return null;
  return (
    <span
      dangerouslySetInnerHTML={{ __html: value }}
      className="[&_mark]:bg-yellow-200 [&_mark]:text-yellow-900 [&_mark]:rounded [&_mark]:px-0.5"
    />
  );
}
