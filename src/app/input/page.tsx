"use client";

import React, { useState, useEffect } from 'react';

interface Skill {
  name: string;
  level: number;
  category: string;
  furigana?: string;  // ここを追加
  overwrite?: boolean;
}

export default function SkillForm() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [inputName, setInputName] = useState('');
  const [inputLevel, setInputLevel] = useState(1);
  const [inputCategory, setInputCategory] = useState('攻撃系');
  const [inputFurigana, setInputFurigana] = useState('');  // ふりがな用ステート追加
  const [message, setMessage] = useState('');
  const [pendingSkill, setPendingSkill] = useState<Skill | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/skill');
      if (res.ok) {
        const data = await res.json();
        setSkills(data);
      }
    })();
  }, []);

  const handleAddClick = async () => {
    if (!inputName.trim()) {
      setMessage('スキル名を入力してください');
      return;
    }
    if (!inputFurigana.trim()) {
      setMessage('ふりがなを入力してください');
      return;
    }

    // すでに存在するかチェック
    const exists = skills.some(skill => skill.name === inputName.trim());

    if (exists) {
      // 上書き確認用に一旦保留
      setPendingSkill({
        name: inputName.trim(),
        level: inputLevel,
        category: inputCategory,
        furigana: inputFurigana.trim(),
      });
      setMessage('同じ名前のスキルがあります。上書きしますか？');
      return;
    }

    // 新規追加
    await saveSkill({
      name: inputName.trim(),
      level: inputLevel,
      category: inputCategory,
      furigana: inputFurigana.trim(),
    });
  };

  const saveSkill = async (skill: Skill) => {
    const res = await fetch('/api/input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skill),
    });

    if (res.ok) {
      const data = await res.json();
      setMessage(data.message);
      // スキル一覧更新
      const updated = skill.overwrite
        ? skills.map(s => (s.name === skill.name ? skill : s))
        : [...skills, skill];
      setSkills(updated);

      // フォームリセット
      setInputName('');
      setInputLevel(1);
      setInputCategory('攻撃系');
      setInputFurigana('');  // ふりがなもリセット
      setPendingSkill(null);
    } else {
      setMessage('保存に失敗しました');
    }
  };

  const confirmOverwrite = async (overwrite: boolean) => {
    if (!pendingSkill) return;
    if (overwrite) {
      await saveSkill({ ...pendingSkill, overwrite: true });
    } else {
      setMessage('スキルの追加をキャンセルしました');
      setPendingSkill(null);
    }
  };

  return (
    <div>
      <h2>スキル登録フォーム</h2>
      <input
        type="text"
        placeholder="スキル名を入力"
        value={inputName}
        onChange={e => setInputName(e.target.value)}
      />
      <input
        type="text"
        placeholder="ふりがなを入力"
        value={inputFurigana}
        onChange={e => setInputFurigana(e.target.value)}
        style={{ marginLeft: '8px' }}
      />
      <select value={inputLevel} onChange={e => setInputLevel(Number(e.target.value))}>
        {[1, 2, 3, 4, 5, 6, 7].map(lv => (
          <option key={lv} value={lv}>
            {lv}
          </option>
        ))}
      </select>
      <select value={inputCategory} onChange={e => setInputCategory(e.target.value)}>
        <option value="攻撃系">攻撃系</option>
        <option value="生存系">生存系</option>
        <option value="快適系">快適系</option>
      </select>
      <button onClick={handleAddClick}>追加</button>

      <p>{message}</p>

      {pendingSkill && (
        <div style={{ marginTop: 10, border: '1px solid #ccc', padding: 10 }}>
          <p>{pendingSkill.name} は既に存在します。上書きしますか？</p>
          <button style={{ marginRight: '10px' }} onClick={() => confirmOverwrite(true)}>上書きする</button>
          <button style={{ color: 'red' }} onClick={() => confirmOverwrite(false)}>キャンセル</button>
        </div>
      )}

      <h3>現在のスキル一覧</h3>
      <ul>
        {skills.map((skill, i) => (
          <li key={i}>
            {skill.name} (レベル{skill.level}) - {skill.category} - ふりがな: {skill.furigana ?? '-'}
          </li>
        ))}
      </ul>
    </div>
  );
}
