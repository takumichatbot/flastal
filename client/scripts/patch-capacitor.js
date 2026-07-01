#!/usr/bin/env node

// @capacitor-community/apple-sign-in v7.x の Package.swift は
// capacitor-swift-pm を from: "7.0.0" (= 7.0.0..<8.0.0) で参照するが、
// 他の @capacitor/* v8.x は 8.0.0..<9.0.0 を要求するためSPMが競合する。
// from: "7.0.0" を "7.0.0"..<"9.0.0" に書き換えて両バージョンを受け入れる。

const fs = require('fs');
const path = require('path');

const packageSwiftPath = path.join(
    __dirname,
    '..',
    'node_modules',
    '@capacitor-community',
    'apple-sign-in',
    'Package.swift'
);

try {
    const original = fs.readFileSync(packageSwiftPath, 'utf8');
    const patched = original.replace(
        '.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")',
        '.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", "7.0.0"..<"9.0.0")'
    );

    if (patched === original) {
        console.log('[patch-capacitor] Package.swift already patched or pattern not found. Skipping.');
    } else {
        fs.writeFileSync(packageSwiftPath, patched);
        console.log('[patch-capacitor] Patched @capacitor-community/apple-sign-in Package.swift (7.0.0 -> 7.0.0..<9.0.0)');
    }
} catch (e) {
    console.warn('[patch-capacitor] Could not patch Package.swift:', e.message);
}
