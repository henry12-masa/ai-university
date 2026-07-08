# AI大学受験クイズ

慶應義塾大学レベル、早稲田大学レベル、東京大学レベル、京都大学レベル、共通テストレベルを選べる大学受験対策クイズです。

## 重要

赤本や大学入試過去問の本文・設問をそのままコピーして収録しないでください。このテンプレートは、出題傾向を参考にしたオリジナル問題をJSデータとして読み込む用途です。

## 機能

- `window.quizData.keio` のようにJSから問題を読み込み
- 全レベルミックス、大学別、学部別対策
- 50問ランダム出題
- 問題文重複を除外
- 回答後に自動で次の問題へ移動
- AI解説風コメント
- 間違えた問題だけ復習
- localStorageによる苦手分析
- 左右AdSense広告枠

## ファイル構成

```text
index.html
script.js
style.css
data/
  university/
    keio.js
    waseda.js
    todai.js
    kyodai.js
    common-test.js
```

## URL例

```text
index.html
index.html?type=keio
index.html?type=waseda
index.html?type=todai
index.html?type=kyodai
index.html?type=commonTest
index.html?type=keio&faculty=法学部
```

## 問題データの形式

```js
window.quizData.keio = [
  {
    id: "keio-e-001",
    university: "慶應義塾大学レベル",
    faculty: "法学部",
    subject: "英語",
    skill: "論理読解",
    question: "問題文",
    choices: ["A", "B", "C", "D"],
    answer: "B",
    explanation: "解説",
    aiHint: "AI解説風コメント"
  }
];
```
