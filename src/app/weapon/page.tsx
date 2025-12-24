'use client';

import React, { useState, useEffect } from "react";

type SkillType = { name: string; maxLevel: number };
type SkillEntry = { name: string; level: number };

interface WeaponFormData {
  name: string;
  furigana: string;
  type: string;
  attack: number;
  affinity: number;
  element: string;
  elementAtk: number;
  slot1: number;
  slot2: number;
  slot3: number;
  skills: SkillEntry[];
}

type Weapon = WeaponFormData & { id: number };

const weaponTypes = [
  "大剣", "太刀", "片手剣", "双剣", "ハンマー", "狩猟笛", "ランス", "ガンランス",
  "スラッシュアックス", "チャージアックス", "操虫棍", "ライトボウガン", "ヘビィボウガン", "弓"
];

const attributeOptions = [
  "無属性", "火属性", "水属性", "雷属性", "氷属性", "龍属性", "毒属性",
  "麻痺属性", "睡眠属性", "爆破属性"
];

const slotOptions = [0, 1, 2, 3];

export default function WeaponForm() {
  const [skillsDB, setSkillsDB] = useState<SkillType[]>([]);
  const [weaponList, setWeaponList] = useState<Weapon[]>([]);
  const [formData, setFormData] = useState<WeaponFormData>({
    name: "",
    furigana: "",
    type: weaponTypes[0],
    attack: 0,
    affinity: 0,
    element: attributeOptions[0],
    elementAtk: 0,
    slot1: 0,
    slot2: 0,
    slot3: 0,
    skills: [{ name: "", level: 0 }],
  });
  const [message, setMessage] = useState<string>("");
  const [pendingWeapon, setPendingWeapon] = useState<WeaponFormData | null>(null);

  useEffect(() => {
    fetch("/api/weapon-skill")
      .then(res => res.json())
      .then(setSkillsDB)
      .catch(() => setSkillsDB([]));
    fetch("/api/weaponinput")
      .then(res => res.json())
      .then(setWeaponList)
      .catch(() => setWeaponList([]));
  }, []);

  const onFieldChange = (field: keyof WeaponFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onSkillChange = (index: number, key: keyof SkillEntry, value: any) => {
    setFormData(prev => {
      const updatedSkills = [...prev.skills];
      if (!updatedSkills[index]) updatedSkills[index] = { name: "", level: 0 };
      updatedSkills[index] = { ...updatedSkills[index], [key]: value };
      if (key === "name") {
        const maxLevel = skillsDB.find(s => s.name === value)?.maxLevel ?? 0;
        if (updatedSkills[index].level > maxLevel) updatedSkills[index].level = 0;
      }
      return { ...prev, skills: updatedSkills };
    });
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: "", level: 0 }],
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => {
      const filtered = prev.skills.filter((_, i) => i !== index);
      return { ...prev, skills: filtered.length ? filtered : [{ name: "", level: 0 }] };
    });
  };

  const exists = (name: string) => weaponList.some(w => w.name === name);

  const validateForm = (data: WeaponFormData): string | null => {
    if (!data.name.trim()) return "武器名は必須です";
    if (!data.furigana.trim()) return "ふりがなは必須です";
    if (!weaponTypes.includes(data.type)) return "武器種が不正です";
    if (data.attack < 0) return "攻撃力は0以上である必要があります";
    if (data.affinity < -100 || data.affinity > 100) return "会心率は-100〜100の範囲である必要があります";
    if (!attributeOptions.includes(data.element)) return "属性が不正です";
    if (data.element === "無属性" && data.elementAtk !== 0)
      return "無属性の属性攻撃力は0でなければなりません";
    if (data.element !== "無属性" && data.elementAtk <= 0)
      return "属性攻撃力は0より大きい値でなければなりません";
    if (![0, 1, 2, 3].includes(data.slot1)) return "スロット1の値が不正です";
    if (![0, 1, 2, 3].includes(data.slot2)) return "スロット2の値が不正です";
    if (![0, 1, 2, 3].includes(data.slot3)) return "スロット3の値が不正です";
    for (const skill of data.skills) {
      if (!skill.name.trim()) return "スキル名は必須です";
      if (skill.level < 0) return "スキルレベルは0以上でなければなりません";
    }
    return null;
  };

  const handleAddClick = async () => {
    const validationError = validateForm(formData);
    if (validationError) {
      setMessage(validationError);
      return;
    }
    if (exists(formData.name.trim())) {
      setPendingWeapon({ ...formData });
      setMessage("同じ名前の武器があります。上書きしますか？");
      return;
    }
    await saveWeapon(formData);
  };

  const saveWeapon = async (weapon: WeaponFormData & { overwrite?: boolean }) => {
    try {
      const res = await fetch("/api/weaponinput", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weapon),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage("登録・更新が完了しました");
        setWeaponList(data);
        setFormData({
          name: "",
          furigana: "",
          type: weaponTypes[0],
          attack: 0,
          affinity: 0,
          element: attributeOptions[0],
          elementAtk: 0,
          slot1: 0,
          slot2: 0,
          slot3: 0,
          skills: [{ name: "", level: 0 }],
        });
        setPendingWeapon(null);
      } else {
        const errorData = await res.json();
        setMessage(`登録に失敗しました: ${errorData.message || "不明なエラー"}`);
      }
    } catch (error) {
      setMessage("登録に失敗しました(ネットワークエラー)");
      console.error(error);
    }
  };

  const confirmOverwrite = async (overwrite: boolean) => {
    if (!pendingWeapon) return;
    if (overwrite) {
      await saveWeapon({ ...pendingWeapon, overwrite: true });
    } else {
      setMessage("登録をキャンセルしました");
      setPendingWeapon(null);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "auto" }}>
      <h2>武器登録フォーム</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddClick();
        }}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label>
          武器名
          <input
            value={formData.name}
            onChange={(e) => onFieldChange("name", e.target.value)}
          />
        </label>

        <label>
          ふりがな
          <input
            type="text"
            value={formData.furigana}
            placeholder="ふりがなを入力"
            onChange={(e) => onFieldChange("furigana", e.target.value)}
          />
        </label>

        <label>
          武器種
          <select
            value={formData.type}
            onChange={(e) => onFieldChange("type", e.target.value)}
          >
            {weaponTypes.map((type) => (
              <option key={type} value={type} style={{ color: "black" }}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label>
          攻撃力
          <input
            type="number"
            value={formData.attack}
            onChange={(e) => onFieldChange("attack", Number(e.target.value))}
            min={0}
          />
        </label>

        <label>
          会心率（%）
          <input
            type="number"
            value={formData.affinity}
            onChange={(e) => onFieldChange("affinity", Number(e.target.value))}
            min={-100}
            max={100}
          />
        </label>

        <label>
          属性
          <select
            value={formData.element}
            onChange={(e) => onFieldChange("element", e.target.value)}
          >
            {attributeOptions.map((attr) => (
              <option key={attr} value={attr} style={{ color: "black" }}>
                {attr}
              </option>
            ))}
          </select>
        </label>

        <label>
          属性攻撃力
          <input
            type="number"
            value={formData.elementAtk}
            onChange={(e) => onFieldChange("elementAtk", Number(e.target.value))}
            min={0}
          />
        </label>

        {[1, 2, 3].map((i) => (
          <label key={i}>
            スロット{i}
            <select
              value={(formData as any)[`slot${i}`]}
              onChange={(e) => onFieldChange(`slot${i}` as keyof WeaponFormData, Number(e.target.value))}
            >
              {slotOptions.map((num) => (
                <option key={num} value={num} style={{ color: "black" }}>
                  {num}
                </option>
              ))}
            </select>
          </label>
        ))}

        <div>
          スキル
          {formData.skills.map((skill, i) => {
            const maxLevel = skillsDB.find((s) => s.name === skill.name)?.maxLevel || 0;
            return (
              <div
                key={i}
                style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}
              >
                <select
                  value={skill.name}
                  onChange={(e) => onSkillChange(i, "name", e.target.value)}
                  style={{ flexGrow: 1 }}
                >
                  <option value="">-- スキルを選択 --</option>
                  {skillsDB.map((s) => (
                    <option key={s.name} value={s.name} style={{ color: "black" }}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={skill.level}
                  onChange={(e) => onSkillChange(i, "level", Number(e.target.value))}
                  disabled={!skill.name}
                  style={{ width: 70 }}
                >
                  <option value={0}>0</option>
                  {[...Array(maxLevel).keys()].map((lvl) => (
                    <option key={lvl + 1} value={lvl + 1}>
                      {lvl + 1}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => removeSkill(i)}
                  disabled={formData.skills.length <= 1}
                  style={{ color: "red" }}
                >
                  削除
                </button>
              </div>
            );
          })}
          <button type="button" onClick={addSkill}>
            スキル追加
          </button>
        </div>

        <button type="submit" style={{ marginTop: 20 }}>
          武器を登録
        </button>
      </form>

      {pendingWeapon && (
        <div style={{ marginTop: 10, border: "1px solid #ccc", padding: 10 }}>
          <p>{pendingWeapon.name} は既に存在します。上書きしますか？</p>
          <button
            style={{ marginRight: 10 }}
            onClick={() => confirmOverwrite(true)}
          >
            上書きする
          </button>
          <button style={{ color: "red" }} onClick={() => confirmOverwrite(false)}>
            キャンセル
          </button>
        </div>
      )}

      <h3 style={{ marginTop: 40 }}>登録済み武器一覧</h3>
      <table
        border={1}
        cellPadding={6}
        style={{ width: "100%", tableLayout: "fixed", wordBreak: "break-word" }}
      >
        <thead>
          <tr>
            <th>名前</th>
            <th>ふりがな</th>
            <th>武器種</th>
            <th>攻撃力</th>
            <th>会心率(%)</th>
            <th>属性</th>
            <th>属性攻撃力</th>
            <th>スロット</th>
            <th>スキル</th>
          </tr>
        </thead>
        <tbody>
          {weaponList.map((w) => (
            <tr key={w.id}>
              <td>{w.name}</td>
              <td>{w.furigana || ""}</td>
              <td>{w.type}</td>
              <td>{w.attack}</td>
              <td>{w.affinity}</td>
              <td>{w.element}</td>
              <td>{w.elementAtk}</td>
              <td>{`${w.slot1}/${w.slot2}/${w.slot3}`}</td>
              <td>
                {(w.skills || []).map((s, i) => (
                  <span key={i} style={{ whiteSpace: "nowrap" }}>
                    {s.name} Lv{s.level}
                    {i < (w.skills?.length ?? 0) - 1 ? ", " : ""}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
