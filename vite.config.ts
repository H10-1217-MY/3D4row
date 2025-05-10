import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages用の設定
export default defineConfig({
  plugins: [react()],
  base: '/3D4row/', // GitHub Pages用のベースパス（リポジトリ名と一致）
  build: {
    outDir: 'docs', // 出力先を/docsに設定
    emptyOutDir: true, // ビルド前に出力ディレクトリを空にする
  },
});