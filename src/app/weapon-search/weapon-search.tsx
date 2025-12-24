"use client";

import { useState, useEffect } from "react";

type SkillItem = {
  name: string;
  level: number;
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
  skills: { name: string; level: number }[] | string;
};

type Props = {
  weaponType: string;
  weaponElement: string;
  selectedWeaponName: string;
  selectedWeaponSkills: SkillItem[];
};

function parseSkillsField(skillsField: Weapon["skills"]) {
  if (typeof skillsField === "string") {
    try {
      const parsed = JSON.parse(skillsField);
      if (Array.isArray(parsed)) return parsed as { name: string; level: number }[];
      return [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(skillsField)) return skillsField;
  return [];
}

function WeaponCandidatesTable({ weapons }: { weapons: Weapon[] }) {
  return (
    <table
      border={1}
      cellPadding={6}
      style={{ width: "100%", borderCollapse: "collapse", wordBreak: "break-word" }}
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
        {weapons.map((w) => {
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
                  <span key={i}>
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
  );
}

export default function WeaponSearch({
  weaponType,
  weaponElement,
  selectedWeaponName,
  selectedWeaponSkills,
}: Props) {
  const [weaponCandidates, setWeaponCandidates] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(false);

  const shouldCallApi =
    selectedWeaponSkills.length > 0 || selectedWeaponName !== "";

  useEffect(() => {
    if (shouldCallApi) {
      setLoading(true);
      fetch("/api/weapon-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weaponType: weaponType || undefined,
          weaponElement: weaponElement || undefined,
          weaponSkills: selectedWeaponSkills,
          selectedWeaponName: selectedWeaponName || undefined,
        }),
      })
        .then((res) => res.json())
        .then((data) => setWeaponCandidates(data.weaponCandidates ?? []))
        .finally(() => setLoading(false));
    } else {
      setWeaponCandidates([]);
    }
  }, [weaponType, weaponElement, selectedWeaponName, selectedWeaponSkills]);

  if (loading) return <p>武器を検索中...</p>;

  if (shouldCallApi) {
    return (
      <div>
        {weaponCandidates.length === 0 ? (
          <p>該当する武器はありません</p>
        ) : (
          <>
            <h3>武器候補</h3>
            <WeaponCandidatesTable weapons={weaponCandidates} />
          </>
        )}
      </div>
    );
  }

  if (!weaponType && !weaponElement) return null;

  return (
    <div style={{ fontWeight: "bold", fontSize: 18 }}>
      {weaponType && !weaponElement && <>武器種: {weaponType}</>}
      {!weaponType && weaponElement && <>属性: {weaponElement}</>}
      {weaponType && weaponElement && (
        <>
          {weaponType} {weaponElement}属性
        </>
      )}
    </div>
  );
}
