# 開発ガイド

GitHub Pages で静的ホスティングするミニゲーム集。ビルドなしのバニラ HTML/CSS/JS で作る(3D ゲームは three.js を `lib/` に vendoring して使う)。

## 構成

- `index.html` — ポータル。`games.json` を fetch してゲーム一覧を描画する
- `games.json` — ゲームのメタデータ一覧
- `shared/theme.css` — 共通テーマ(配色・ヘッダー・戻るリンク)
- `games/<id>/` — 1ゲーム = 1フォルダで完全独立

## ゲームの追加手順

1. `games/<id>/` を作り、`index.html` + `game.js`(+ 必要なら `style.css`)を置く
2. `games.json` に id / title / description / icon(絵文字)/ tags / path を追加する

## 各ゲームの必須要件

- `games/<id>/index.html` を開くだけで動くこと(ゲーム間の依存禁止)
- `../../shared/theme.css` を読み込み、共通ヘッダーと「← 一覧へ」リンクを付ける(reflex-tap 参照)
- スマホ対応必須: viewport メタタグ + タッチ操作(`pointerdown` 等の Pointer Events を使う)

## 動作確認

```sh
python3 -m http.server 8000  # リポジトリルートで実行し http://localhost:8000 を開く
```

## デプロイ

main への push で GitHub Actions がリポジトリ全体をそのまま Pages に公開する。
