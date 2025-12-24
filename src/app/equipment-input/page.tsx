"use client";

import React, { useState, useEffect } from "react";

type SkillType = { name: string; level: number };
type SkillEntry = { name: string; level: number };
type Equipment = {
  id: number;
  part: string;
  name: string;
  defense: number;
  slot1: number;
  slot2: number;
  slot3: number;
  series?: string;
  group?: string;
  skills?: SkillEntry[];
};

const equipParts = ["head", "body", "arm", "waist", "leg"];
const slotOptions = [0, 1, 2, 3];

export default function EquipmentForm() {
  const [skillsDB, setSkillsDB] = useState<SkillType[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    part: "",
    defense: 0,
    slot1: 0,
    slot2: 0,
    slot3: 0,
    series: "",
    group: "",
    skills: [{ name: "", level: 0 }],
  });

  useEffect(() => {
    fetch("/api/getskill")
      .then((res) => res.json())
      .then(setSkillsDB)
      .catch(() => setSkillsDB([]));

    fetch("/api/equipment")
      .then((res) => res.json())
      .then(setEquipmentList)
      .catch(() => setEquipmentList([]));
  }, []);

  const onFieldChange = (key: keyof typeof formData, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const onSkillChange = (index: number, key: keyof SkillEntry, value: any) => {
    setFormData((prev) => {
      const skillsCopy = [...prev.skills];
      if (!skillsCopy[index]) skillsCopy[index] = { name: "", level: 0 };
      skillsCopy[index] = { ...skillsCopy[index], [key]: value };

      if (key === "name") {
        const maxLevel = skillsDB.find((s) => s.name === value)?.level ?? 0;
        if (skillsCopy[index].level > maxLevel) {
          skillsCopy[index].level = 0;
        }
      }

      return { ...prev, skills: skillsCopy };
    });
  };

  const addSkill = () =>
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { name: "", level: 0 }],
    }));

  const removeSkill = (index: number) => {
    setFormData((prev) => {
      const filtered = prev.skills.filter((_, i) => i !== index);
      return { ...prev, skills: filtered.length ? filtered : [{ name: "", level: 0 }] };
    });
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.part) {
      alert("名前と部位は必須です");
      return;
    }
    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("登録失敗");

      const updated = await res.json();
      setEquipmentList(updated);

      setFormData({
        name: "",
        part: "",
        defense: 0,
        slot1: 0,
        slot2: 0,
        slot3: 0,
        series: "",
        group: "",
        skills: [{ name: "", level: 0 }],
      });

      alert("防具登録が完了しました");
    } catch {
      alert("登録に失敗しました");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "auto" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleRegister();
        }}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label>
          名前
          <input value={formData.name} onChange={(e) => onFieldChange("name", e.target.value)} />
        </label>

        <label>
          部位
          <select value={formData.part} onChange={(e) => onFieldChange("part", e.target.value)}>
            <option value="">選択してください</option>
            {equipParts.map((part) => (
              <option key={part} value={part} style={{color:"black"}}>
                {part}
              </option>
            ))}
          </select>
        </label>

        <label>
          防御力
          <input
            type="number"
            value={formData.defense}
            onChange={(e) => onFieldChange("defense", Number(e.target.value))}
          />
        </label>

        {[1, 2, 3].map((i) => (
          <label key={i}>
            スロット{i}
            <select
              value={(formData as any)[`slot${i}`]}
              onChange={(e) =>
                onFieldChange(`slot${i}` as keyof typeof formData, Number(e.target.value))
              }
            >
              {slotOptions.map((num) => (
                <option key={num} value={num} style={{color:"black"}}>
                  {num}
                </option>
              ))}
            </select>
          </label>
        ))}

        <label>
          シリーズ
          <input value={formData.series} onChange={(e) => onFieldChange("series", e.target.value)} />
        </label>

        <label>
          グループ
          <input value={formData.group} onChange={(e) => onFieldChange("group", e.target.value)} />
        </label>

        <div>
          スキル
          {formData.skills.map((skill, i) => {
            const maxLevel = skillsDB.find((s) => s.name === skill.name)?.level || 0;
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
                    <option key={s.name} value={s.name} style={{color:"black"}}>
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
          防具を登録
        </button>
      </form>

      <h3 style={{ marginTop: 40 }}>登録済み防具一覧</h3>
      <table
        border={1}
        cellPadding={6}
        style={{ width: "100%", tableLayout: "fixed", wordBreak: "break-word" }}
      >
        <thead>
          <tr>
            <th>名前</th>
            <th>部位</th>
            <th>防御力</th>
            <th>スロット</th>
            <th>シリーズ</th>
            <th>グループ</th>
            <th>スキル</th>
          </tr>
        </thead>
        <tbody>
          {equipmentList.map((eq) => (
            <tr key={eq.id}>
              <td>{eq.name}</td>
              <td>{eq.part}</td>
              <td>{eq.defense}</td>
              <td>{`${eq.slot1}/${eq.slot2}/${eq.slot3}`}</td>
              <td>{eq.series ?? ""}</td>
              <td>{eq.group ?? ""}</td>
              <td>
                {(eq.skills || []).map((s, i) => (
                  <span key={i} style={{ whiteSpace: "nowrap" }}>
                    {s.name} Lv{s.level}
                    {i < (eq.skills?.length ?? 0) - 1 ? ", " : ""}
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
