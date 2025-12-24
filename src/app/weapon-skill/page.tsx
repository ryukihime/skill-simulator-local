'use client';

import React, { useState, useEffect } from 'react';

interface WeaponSkill {
  name: string;
  furigana?: string; // 新規追加
  maxLevel: number;
  overwrite?: boolean;
}

export default function WeaponSkillForm() {
  const [skills, setSkills] = useState<WeaponSkill[]>([]);
  const [inputName, setInputName] = useState('');
  const [inputFurigana, setInputFurigana] = useState(''); // 追加
  const [inputMaxLevel, setInputMaxLevel] = useState(1);
  const [message, setMessage] = useState('');
  const [pendingSkill, setPendingSkill] = useState<WeaponSkill | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/weapon-skill');
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

    const exists = skills.some(skill => skill.name === inputName.trim());

    if (exists) {
      setPendingSkill({
        name: inputName.trim(),
        furigana: inputFurigana.trim(), // 追加
        maxLevel: inputMaxLevel,
      });
      setMessage('同じ名前のスキルがあります。上書きしますか？');
      return;
    }

    await saveSkill({
      name: inputName.trim(),
      furigana: inputFurigana.trim(), // 追加
      maxLevel: inputMaxLevel,
    });
  };

  const saveSkill = async (skill: WeaponSkill) => {
    const res = await fetch('/api/weapon-skill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skill),
    });

    if (res.ok) {
      const data = await res.json();
      setMessage(data.message);

      const updated = skill.overwrite
        ? skills.map(s => (s.name === skill.name ? skill : s))
        : [...skills, skill];

      setSkills(updated);

      // フォームリセット
      setInputName('');
      setInputFurigana(''); // 追加
      setInputMaxLevel(1);
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
      <h2>武器スキル登録フォーム</h2>
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
        style={{ marginLeft: '10px' }} // 並列表示用（任意）
      />
      <select value={inputMaxLevel} onChange={e => setInputMaxLevel(Number(e.target.value))}>
        {[1, 2, 3, 4, 5, 6, 7].map(lv => (
          <option key={lv} value={lv}>
            {lv}
          </option>
        ))}
      </select>
      <button onClick={handleAddClick}>追加</button>

      <p>{message}</p>

      {pendingSkill && (
        <div style={{ marginTop: 10, border: '1px solid #ccc', padding: 10 }}>
          <p>
            {pendingSkill.name} ({pendingSkill.furigana}) は既に存在します。上書きしますか？
          </p>
          <button style={{ marginRight: 10 }} onClick={() => confirmOverwrite(true)}>
            上書きする
          </button>
          <button style={{ color: 'red' }} onClick={() => confirmOverwrite(false)}>
            キャンセル
          </button>
        </div>
      )}

      <h3>現在の武器スキル一覧</h3>
      <ul>
        {skills.map((skill, i) => (
          <li key={i}>
            {skill.name}
            {skill.furigana && `（${skill.furigana}）`} (最大レベル {skill.maxLevel})
          </li>
        ))}
      </ul>
    </div>
  );
}
