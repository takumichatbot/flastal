'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flastal-backend.onrender.com';

function cn(...classes) { return classes.filter(Boolean).join(' '); }

const inputClass = "w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-300/50 focus:ring-offset-1 transition-all font-medium text-slate-700 placeholder:text-slate-300";
const inputErrorClass = "w-full px-4 py-3.5 bg-red-50 border border-red-300 rounded-2xl focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-300/50 focus:ring-offset-1 transition-all font-medium text-slate-700 placeholder:text-slate-300";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = (data) => {
    const errs = {};
    if (!data.name || data.name.trim().length < 1) {
      errs.name = 'お名前を入力してください。';
    }
    if (!data.email || !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(data.email)) {
      errs.email = '有効なメールアドレスを入力してください。';
    }
    if (!data.message || data.message.trim().length < 10) {
      errs.message = 'お問い合わせ内容は10文字以上で入力してください。';
    }
    if (data.message && data.message.length > 1000) {
      errs.message = 'お問い合わせ内容は1000文字以内で入力してください。';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());

    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setIsSent(true);
        toast.success('お問い合わせを送信しました');
      } else {
        throw new Error('送信失敗');
      }
    } catch {
      toast.error('送信に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/60 to-rose-50/40 font-sans py-10 px-4">

      {/* 背景装飾 */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-pink-200/25 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-rose-100/30 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-lg mx-auto relative z-10">

        {/* 戻るリンク */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-pink-500 transition-colors mb-6">
          <ArrowLeft size={15} /> トップページに戻る
        </Link>

        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-pink-100">
            <Mail size={28} className="text-pink-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">お問い合わせ</h1>
          <p className="text-slate-400 mt-2 font-medium text-sm">サービスに関するご質問やご相談を承ります。</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {isSent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] shadow-sm border border-white text-center"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">送信完了</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                お問い合わせありがとうございます。<br />
                内容を確認次第、担当よりメールにてご連絡いたします。
              </p>
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black shadow-lg shadow-pink-100 text-sm"
                >
                  トップページへ戻る
                </motion.button>
              </Link>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleSubmit}
              noValidate
              className="bg-white/80 backdrop-blur-xl p-7 md:p-8 rounded-[2rem] shadow-sm border border-white space-y-5"
            >
              {/* お名前 */}
              <div>
                <label htmlFor="contact-name" className="block text-xs font-black text-slate-500 mb-2 tracking-widest uppercase">
                  お名前 <span className="text-pink-400">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  required
                  minLength={1}
                  maxLength={100}
                  placeholder="推し活 太郎"
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  aria-invalid={!!errors.name}
                  className={errors.name ? inputErrorClass : inputClass}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-red-600 mt-1.5 ml-1 font-medium" role="alert">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* メールアドレス */}
              <div>
                <label htmlFor="contact-email" className="block text-xs font-black text-slate-500 mb-2 tracking-widest uppercase">
                  メールアドレス <span className="text-pink-400">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="example@flastal.com"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                  className={errors.email ? inputErrorClass : inputClass}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-600 mt-1.5 ml-1 font-medium" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* お問い合わせ内容 */}
              <div>
                <label htmlFor="contact-message" className="block text-xs font-black text-slate-500 mb-2 tracking-widest uppercase">
                  お問い合わせ内容 <span className="text-pink-400">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  required
                  minLength={10}
                  maxLength={1000}
                  placeholder="ご質問内容をご記入ください（10〜1000文字）"
                  aria-describedby={errors.message ? 'message-error' : 'message-hint'}
                  aria-invalid={!!errors.message}
                  className={cn(errors.message ? inputErrorClass : inputClass, "resize-none")}
                />
                {errors.message ? (
                  <p id="message-error" className="text-sm text-red-600 mt-1.5 ml-1 font-medium" role="alert">
                    {errors.message}
                  </p>
                ) : (
                  <p id="message-hint" className="text-xs text-slate-400 mt-1.5 ml-1 font-medium">
                    10〜1000文字で入力してください
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-pink-100 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
                {isSubmitting ? '送信中...' : 'メッセージを送信する'}
              </motion.button>

              <p className="text-center text-[11px] text-slate-400 font-medium">
                通常3営業日以内にご返信いたします。
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
