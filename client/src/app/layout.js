export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <body className="font-sans antialiased text-slate-900 bg-white min-h-screen flex flex-col">
        <ThemeController />
        <AuthProvider>
          <Suspense fallback={null}>
            {/* ここからHeaderとLiveTickerを削除または条件分岐で非表示にする */}
            {/* 他のページでも使いたい場合は、HomePage以外で表示されるように調整してください */}
            <main className="flex-grow w-full">
              {children}
            </main>
            <FloatingMenu />
          </Suspense>
          <Footer />
          <Toaster position="top-center" /> 
          <PushNotificationManager />
        </AuthProvider>
      </body>
    </html>
  );
}