"use client";

import { useEffect, useState } from "react";

type SkillItem = {
  name: string;
  level: number;
};

type Armor = {
  id: number;
  name: string;
  part: string;
  defense: number;
  skills: unknown;
};

type Weapon = {
  id: number;
  name: string;
  type: string;
  attack: number;
  affinity: number | null;
  element: string | null;
  elementAtk: number | null;
  slot1: number;
  slot2: number;
  slot3: number;
  skills: unknown;
};

type Props = {
  selectedArmorSkills: SkillItem[];
  selectedWeaponSkills: SkillItem[];
};

// 部位ごとの表示順序
const PART_ORDER = ["head", "body", "arm", "waist", "leg"];

function parseSkillsField(skillsField: unknown): SkillItem[] {
  if (typeof skillsField === "string") {
    try {
      const parsed = JSON.parse(skillsField);
      if (Array.isArray(parsed)) {
        return parsed as SkillItem[];
      }
      return [];
    } catch {
      return [];
    }
  } else if (Array.isArray(skillsField)) {
    return skillsField as SkillItem[];
  }
  return [];
}

export default function CombinationSearch({ selectedArmorSkills, selectedWeaponSkills }: Props) {
  const [armorResults, setArmorResults] = useState<Armor[][]>([]);
  const [weaponCandidates, setWeaponCandidates] = useState<Weapon[]>([]);

  useEffect(() => {
    if (selectedArmorSkills.length === 0 && selectedWeaponSkills.length === 0) {
      setArmorResults([]);
      setWeaponCandidates([]);
      return;
    }
    fetch("/api/armor-seach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ armorSkills: selectedArmorSkills, weaponSkills: selectedWeaponSkills }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API response data:", data);

        // APIから返る防具組み合わせと武器候補をセット
        setArmorResults(data.armorCombinations ?? []);

        if (data.weaponCandidates && data.weaponCandidates.length > 0) {
          setWeaponCandidates(data.weaponCandidates);
        } else {
          // もしAPIから武器が空でもしあれば代替手段として空配列セット（API側で仮武器対応推奨）
          setWeaponCandidates([]);
        }
      })
      .catch((err) => {
        console.error("API request failed:", err);
        setArmorResults([]);
        setWeaponCandidates([]);
      });
  }, [selectedArmorSkills, selectedWeaponSkills]);

  const renderArmorResults = () => {
    if (armorResults.length === 0) return <p>該当する防具装備はありません</p>;

    return (
      <div>
        {armorResults.slice(0, 30).map((combo, index) => {
          // 部位順にソート
          const sortedCombo = [...combo].sort(
            (a, b) => PART_ORDER.indexOf(a.part) - PART_ORDER.indexOf(b.part)
          );

          // 防御力合計を計算
          const totalDefense = sortedCombo.reduce(
            (sum, armor) => sum + armor.defense,
            0
          );

          return (
            <div
              key={index}
              style={{
                marginBottom: 12,
                background: "#fff",
                border: "2px solid #000",
                color: "#000",
                borderRadius: 8,
                padding: "12px",
              }}
            >
              <strong style={{ display: "inline-block", marginRight: 12 }}>
                装備セット #{index + 1}
              </strong>
              <span>
                合計防御力: <strong>{totalDefense}</strong>
              </span>
              <ul>
                {sortedCombo.map((armor) => {
                  const skills = parseSkillsField(armor.skills);
                  return (
                    <li key={armor.id}>
                      {armor.part}: {armor.name} (防御力: {armor.defense})
                      <br />
                      <small>
                        スキル:{" "}
                        {skills.map((s) => `${s.name} Lv.${s.level}`).join(", ")}
                      </small>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeaponCandidates = () => {
    if (weaponCandidates.length === 0) return <p>該当する武器はありません</p>;

    return (
      <div style={{ marginTop: 24 }}>
        <h3>候補となる武器一覧</h3>
        <table
          border={1}
          cellPadding={6}
          style={{ width: "100%", tableLayout: "fixed", wordBreak: "break-word" }}
        >
          <thead>
            <tr>
              <th>名前</th>
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
            {weaponCandidates.map((w) => {
              const skills = parseSkillsField(w.skills);
              return (
                <tr key={w.id}>
                  <td>{w.name}</td>
                  <td>{w.type}</td>
                  <td>{w.attack}</td>
                  <td>{w.affinity ?? "-"}</td>
                  <td>{w.element ?? "-"}</td>
                  <td>{w.elementAtk ?? "-"}</td>
                  <td>{`${w.slot1}/${w.slot2}/${w.slot3}`}</td>
                  <td>
                    {skills.map((s, i) => (
                      <span key={i} style={{ whiteSpace: "nowrap" }}>
                        {s.name} Lv{s.level}
                        {i < skills.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {/* 防具の組み合わせ結果 */}
      {renderArmorResults()}

      {/* 武器候補 */}
      {renderWeaponCandidates()}
    </div>
  );
}
