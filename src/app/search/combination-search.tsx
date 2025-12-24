import { useEffect, useState } from "react";
import { searchArmorCombinations } from "@/lib/search/armorSearch";
import { searchWeapons } from "@/lib/search/weaponSearch";
import { Equipment, Weapon, SkillItem } from "@/lib/masterData";

// Re-map Equipment to Armor alias if needed for compatibility or just use Equipment
type Armor = Equipment;

type Props = {
  selectedArmorSkills: SkillItem[];
  selectedWeaponSkills: SkillItem[];
  weaponType: string;
  weaponElement: string;
  selectedWeaponName: string;
};

const PART_ORDER = ["head", "body", "arm", "waist", "leg"];

function parseSkillsField(skillsField: unknown): SkillItem[] {
  // In our local masterData, skills is already SkillItem[]
  if (Array.isArray(skillsField)) return skillsField as SkillItem[];
  return [];
}

export default function CombinationSearch({
  selectedArmorSkills,
  selectedWeaponSkills,
  weaponType,
  weaponElement,
  selectedWeaponName,
}: Props) {
  const [armorResults, setArmorResults] = useState<Armor[][]>([]);
  const [weaponCandidates, setWeaponCandidates] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Execute logic in a timeout to allow UI to update (show loading)
    // especially since DFS can be sync intensive
    setTimeout(() => {
      try {
        // Armor Search
        const armorRes = searchArmorCombinations(selectedArmorSkills);
        setArmorResults(armorRes);

        // Weapon Search
        let weaponRes: Weapon[] = [];

        if (selectedWeaponName !== "") {
          setWeaponCandidates([]);
        } else if (selectedWeaponSkills.length > 0) {
          // Search for weapons matching skills
          weaponRes = searchWeapons({
            weaponType: weaponType || undefined,
            weaponElement: weaponElement || undefined,
            weaponSkills: selectedWeaponSkills
          });
          setWeaponCandidates(weaponRes);
        } else if (weaponType !== "" || weaponElement !== "") {
          // Filter only by type/element?
          // Original: `if (weaponType !== "" || weaponElement !== "") { weaponPayload = null; setWeaponCandidates([]); }`
          // Wait, if NO weapon skills selected, but type IS selected.
          // The original code passed `weaponPayload = null`!
          // So it shows "No Weapon Info" or just the type name?
          // `renderWeaponText` shows `${weaponType} ${weaponElement}`.
          // So `weaponCandidates` should be empty.
          setWeaponCandidates([]);
        } else {
          setWeaponCandidates([]);
        }

      } catch (e) {
        console.error(e);
        setError("検索中にエラーが発生しました。");
      } finally {
        setLoading(false);
      }
    }, 100);

  }, [
    selectedArmorSkills,
    selectedWeaponSkills,
    weaponType,
    weaponElement,
    selectedWeaponName,
  ]);

  function sortArmorSet(set: Armor[]) {
    return [...set].sort(
      (a, b) => PART_ORDER.indexOf(a.part) - PART_ORDER.indexOf(b.part)
    );
  }

  const renderWeaponText = (weapon: Weapon | null) => {
    if (weapon) return weapon.name;
    if (selectedWeaponName.trim() !== "") return selectedWeaponName;
    if (weaponType !== "" && weaponElement !== "") return `${weaponType} ${weaponElement}`;
    if (weaponType !== "") return weaponType;
    if (weaponElement !== "") return weaponElement;
    return "武器情報なし";
  };

  const combinedSets = [];
  const maxSetsToShow = 30;
  for (const armorSet of armorResults) {
    if (weaponCandidates.length === 0) {
      combinedSets.push({ armorSet, weapon: null });
    } else {
      for (const weapon of weaponCandidates) {
        combinedSets.push({ armorSet, weapon });
        if (combinedSets.length >= maxSetsToShow) break;
      }
      if (combinedSets.length >= maxSetsToShow) break;
    }
  }

  return (
    <div className="space-y-4">
      {loading && <p className="text-center py-6 text-blue-600 animate-pulse font-medium text-sm">最適な組み合わせを検索中...</p>}
      {error && <p className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</p>}
      {!loading && combinedSets.length === 0 && (
        <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">該当する組み合わせはありませんでした。条件を緩めてみてください。</p>
        </div>
      )}
      <div className="grid gap-4">
        {combinedSets.map(({ armorSet, weapon }, idx) => {
          const sortedArmorSet = sortArmorSet(armorSet);
          const totalDefense = sortedArmorSet.reduce((sum, armor) => sum + armor.defense, 0);

          return (
            <div
              key={`${idx}-${weapon ? weapon.id : "no-weapon"}`}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden transition-all hover:border-blue-400 dark:hover:border-blue-500"
            >
              <div className="bg-gray-50 dark:bg-gray-900/40 p-2.5 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                <span className="font-bold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">Set #{idx + 1}</span>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Total DEF: {totalDefense}</span>
              </div>

              <div className="p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-50 dark:border-gray-800/50">
                  <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase">Weapon</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{renderWeaponText(weapon)}</span>
                </div>

                <div className="space-y-2">
                  {sortedArmorSet.map((armor) => {
                    const skills = parseSkillsField(armor.skills);
                    return (
                      <div key={armor.id} className="grid grid-cols-[50px_1fr] gap-2 items-start">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter pt-1 opacity-70">{armor.part}</span>
                        <div>
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="font-bold text-xs sm:text-sm text-gray-700 dark:text-gray-200">{armor.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">+{armor.defense}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {skills.map((s, i) => (
                              <span key={i} className="text-[10px] bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800 shadow-sm whitespace-nowrap">
                                {s.name} <span className="font-bold text-blue-600">Lv.{s.level}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

