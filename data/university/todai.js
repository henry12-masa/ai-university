window.quizData = window.quizData || {};
window.quizData.todai = [
  {id:"todai-e-001",university:"東京大学レベル",faculty:"文科",subject:"英語",skill:"要約",question:"要約で最も避けるべきことはどれか。",choices:["筆者の主張を短くまとめる","具体例をすべて残す","因果関係を保つ","対比構造を残す"],answer:"具体例をすべて残す",explanation:"要約では具体例を削り、主張と論理を残す。",aiHint:"抽象化して骨組みだけを残します。"},
  {id:"todai-m-001",university:"東京大学レベル",faculty:"理科",subject:"数学",skill:"証明",question:"数学の記述答案で最も重要なものはどれか。",choices:["答えだけを書く","使う条件と論理の流れを明示する","計算を省略しすぎる","図だけで終える"],answer:"使う条件と論理の流れを明示する",explanation:"記述ではなぜそう言えるかが採点対象になる。",aiHint:"条件→変形→結論の道筋を見せます。"},
  {id:"todai-j-001",university:"東京大学レベル",faculty:"文科",subject:"現代文",skill:"説明記述",question:"傍線部説明でまず行うべきことはどれか。",choices:["傍線部を分解する","本文を読まずに一般論を書く","難語を増やす","選択肢を作る"],answer:"傍線部を分解する",explanation:"指示語・比喩・抽象語を分解して本文根拠で説明する。",aiHint:"傍線部内の言い換え対象を特定します。"}
];
