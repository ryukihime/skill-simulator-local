"use client";

import { useState, useEffect, useMemo } from "react";
import CombinationSearch from "@/app/search/combination-search";
import { SKILL_DATA, WEAPON_SKILL_DATA, WEAPON_DATA, Skill, WeaponSkill } from "@/lib/masterData";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type WeaponNameOption = {
  name: string;
  furigana?: string | null;
};

export default function SkillPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [weaponSkills, setWeaponSkills] = useState<WeaponSkill[]>([]);

  // Persistent state
  const [selectedLevels, setSelectedLevels] = useLocalStorage<Record<number, number>>("armor-skill-levels", {});
  const [selectedWeaponLevels, setSelectedWeaponLevels] = useLocalStorage<Record<number, number>>("weapon-skill-levels", {});

  // UI state
  const [weaponType, setWeaponType] = useState("");
  const [weaponElement, setWeaponElement] = useState("");
  const [selectedWeaponName, setSelectedWeaponName] = useState("");
  const [searchParams, setSearchParams] = useState<{
    armorSkills: { name: string; level: number }[];
    weaponSkills: { name: string; level: number }[];
    weaponType?: string;
    weaponElement?: string;
    selectedWeaponName?: string;
  }>({ armorSkills: [], weaponSkills: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [weaponNameOptions, setWeaponNameOptions] = useState<WeaponNameOption[]>([]);
  const [weaponNameOpen, setWeaponNameOpen] = useState(false);
  const [weaponNameLoading, setWeaponNameLoading] = useState(false);

  // Constants
  const WEAPON_TYPES = [
    "大剣", "太刀", "片手剣", "双剣", "ハンマー", "狩猟笛", "ランス", "ガンランス", "スラッシュアックス", "チャージアックス", "操虫棍", "ライトボウガン", "ヘビィボウガン", "弓"
  ];
  const WEAPON_ELEMENTS = [
    "無属性", "火属性", "水属性", "雷属性", "氷属性", "龍属性", "毒属性", "麻痺属性", "睡眠属性", "爆破属性"
  ];

  // Load Master Data
  useEffect(() => {
    const sortedSkills = [...SKILL_DATA].sort((a, b) =>
      (a.furigana ?? a.name).localeCompare(b.furigana ?? b.name, "ja")
    );
    setSkills(sortedSkills);
    // We don't overwrite selectedLevels here, let useLocalStorage handle it.
    // But if it's empty, we might want to ensure keys exist? 
    // Actually no, rendering handles missing keys as 0.
  }, []);

  useEffect(() => {
    const sortedWeaponSkills = [...WEAPON_SKILL_DATA].sort((a, b) =>
      (a.furigana ?? a.name).localeCompare(b.furigana ?? b.name, "ja")
    );
    setWeaponSkills(sortedWeaponSkills);
  }, []);

  // Weapon Name Search (Client Side)
  useEffect(() => {
    if (!weaponNameOpen || (!weaponType && !weaponElement)) {
      setWeaponNameOptions([]);
      return;
    }
    setWeaponNameLoading(true);

    // Simulate async for consistency/smoothness
    setTimeout(() => {
      const filtered = WEAPON_DATA.filter(w => {
        if (weaponType && w.type !== weaponType) return false;
        // Handle null element in data vs string in state
        const wElem = w.element || "";
        // If weaponElement is selected
        if (weaponElement && wElem !== weaponElement) {
          // Special case: "無属性" might be stored as null or "None" or ""?
          // In MasterData types: w.element is string.
          // In original DB it was string.
          // WEAPON_ELEMENTS includes "無属性". If DB has "無属性" matching is fine.
          // If DB has "" or null for non-elemental, we need to match.
          // Assuming DB matches the dropdown values or is consistent.
          return false;
        }
        return true;
      });

      const names: WeaponNameOption[] = filtered.map(w => ({
        name: w.name,
        furigana: w.furigana
      }));

      names.sort((a, b) => (a.furigana ?? a.name).localeCompare(b.furigana ?? b.name, "ja"));
      setWeaponNameOptions(names);
      setWeaponNameLoading(false);
    }, 100);
  }, [weaponType, weaponElement, weaponNameOpen]);

  // UI Derived State
  const activeArmorSkills = useMemo(() => {
    return Object.entries(selectedLevels)
      .filter(([, level]) => level > 0)
      .map(([id, level]) => {
        const skill = skills.find((s) => s.id === Number(id));
        return skill ? { name: skill.name, level } : null;
      }).filter((v): v is { name: string; level: number } => v !== null);
  }, [selectedLevels, skills]);

  const activeWeaponSkills = useMemo(() => {
    return Object.entries(selectedWeaponLevels)
      .filter(([, level]) => level > 0)
      .map(([id, level]) => {
        const skill = weaponSkills.find((s) => s.id === Number(id));
        return skill ? { name: skill.name, level } : null;
      }).filter((v): v is { name: string; level: number } => v !== null);
  }, [selectedWeaponLevels, weaponSkills]);

  const allActiveSkills = useMemo(() => {
    return [...activeArmorSkills, ...activeWeaponSkills];
  }, [activeArmorSkills, activeWeaponSkills]);

  const categories = ["攻撃系", "生存系", "快適系"];
  const groupedSkills = categories.map((category) => ({
    category,
    skills: skills.filter((skill) => skill.category?.trim().toLowerCase() === category.toLowerCase()),
  }));

  const categoryConfigs: Record<string, { bg: string; border: string; accent: string }> = {
    "攻撃系": { bg: "bg-red-500/5", border: "border-red-500/20", accent: "text-red-400" },
    "生存系": { bg: "bg-blue-500/5", border: "border-blue-500/20", accent: "text-blue-400" },
    "快適系": { bg: "bg-green-500/5", border: "border-green-500/20", accent: "text-green-400" },
  };

  const onLevelChange = (skillId: number, level: number) => {
    setSelectedLevels((prev) => ({ ...prev, [skillId]: level }));
  };

  const onWeaponLevelChange = (skillId: number, level: number) => {
    setSelectedWeaponLevels((prev) => ({ ...prev, [skillId]: level }));
  };

  const onSearchClick = () => {
    setSearchParams({
      armorSkills: activeArmorSkills,
      weaponSkills: activeWeaponSkills,
      weaponType: weaponType || undefined,
      weaponElement: weaponElement || undefined,
      selectedWeaponName: selectedWeaponName || undefined,
    });
    setShowSearchResults(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const onResetClick = () => {
    setSelectedLevels({});
    setSelectedWeaponLevels({});
    setWeaponType("");
    setWeaponElement("");
    setSelectedWeaponName("");
    setShowSearchResults(false);
    setSearchParams({ armorSkills: [], weaponSkills: [] });
  };

  return (
    <div className="p-2 sm:p-4 max-w-[1400px] mx-auto space-y-4 pb-48">
      {/* 防具スキルカテゴリ別表示 */}
      {groupedSkills.map((group) => {
        const config = categoryConfigs[group.category] || { bg: "bg-zinc-900/50", border: "border-zinc-700/50", accent: "text-zinc-400" };
        return (
          <div key={group.category} className={`${config.bg} p-3 rounded-xl border ${config.border} backdrop-blur-sm shadow-inner`}>
            <h3 className={`text-center mb-3 text-sm sm:text-base font-bold ${config.accent} italic`}>
              {group.category} <span className="text-[10px] font-normal not-italic opacity-40">(防具スキル)</span>
            </h3>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-x-2 gap-y-3">
              {group.skills.map((skill) => (
                <div key={skill.id} className="flex flex-col items-center bg-zinc-800/40 p-2 rounded-lg border border-white/5 shadow-sm hover:bg-zinc-700/50 transition-colors">
                  <label htmlFor={`armor-skill-${skill.id}`} className="mb-1 font-bold text-[10px] sm:text-[11px] text-zinc-300 text-center line-clamp-1 h-4 w-full px-0.5">
                    {skill.name}
                  </label>
                  <div className="relative w-full">
                    <select
                      id={`armor-skill-${skill.id}`}
                      value={selectedLevels[skill.id] ?? 0}
                      onChange={(e) => onLevelChange(skill.id, Number(e.target.value))}
                      className="w-full h-8 text-[11px] border border-white/5 rounded-md bg-zinc-900/80 text-white cursor-pointer focus:ring-1 focus:ring-blue-500 outline-none text-center appearance-none"
                    >
                      {[...Array((skill.level ?? 0) + 1).keys()].map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 text-[8px]">▼</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 武器選択フォーム */}
        <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10 backdrop-blur-sm shadow-inner flex flex-col justify-between">
          <h3 className="text-center mb-4 text-sm sm:text-base font-bold text-orange-300 uppercase tracking-widest italic">武器基本設定</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-1">
              <label htmlFor="weapon-type-select" className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase">武器種</label>
              <div className="relative">
                <select
                  id="weapon-type-select"
                  value={weaponType}
                  onChange={(e) => setWeaponType(e.target.value)}
                  className="w-full h-9 text-xs px-3 border border-white/5 rounded-md bg-zinc-900/80 text-white outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-orange-500/50"
                >
                  <option value="">— 全て —</option>
                  {WEAPON_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 text-[8px]">▼</div>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="weapon-element-select" className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase">属性</label>
              <div className="relative">
                <select
                  id="weapon-element-select"
                  value={weaponElement}
                  onChange={(e) => setWeaponElement(e.target.value)}
                  className="w-full h-9 text-xs px-3 border border-white/5 rounded-md bg-zinc-900/80 text-white outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-orange-500/50"
                >
                  <option value="">— 全て —</option>
                  {WEAPON_ELEMENTS.map((element) => <option key={element} value={element}>{element || "無属性"}</option>)}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 text-[8px]">▼</div>
              </div>
            </div>
          </div>

          <div className="mt-2 text-center">
            <button
              onClick={() => setWeaponNameOpen((o) => {
                const newState = !o;
                if (!newState) setSelectedWeaponName("");
                return newState;
              })}
              className="text-[10px] font-bold text-orange-400/70 hover:text-orange-400 transition-all border-b border-orange-400/20 hover:border-orange-400 pb-0.5"
            >
              {weaponNameOpen ? "特定武器選択を閉じる" : "特定武器名で絞り込む (オプション)"}
            </button>
            {weaponNameOpen && (
              <div className="mt-3 border-t border-white/5 pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {weaponNameLoading ? <p className="text-[10px] py-1 opacity-50 text-zinc-500">読み込み中...</p> :
                  weaponNameOptions.length === 0 ? <p className="text-[10px] py-1 text-zinc-500 italic">該当データなし</p> :
                    <select
                      value={selectedWeaponName}
                      onChange={(e) => setSelectedWeaponName(e.target.value)}
                      size={4}
                      className="w-full text-xs p-2 border border-white/5 rounded-md bg-zinc-900/80 text-zinc-300 outline-none scrollbar-hide focus:ring-1 focus:ring-orange-500/30"
                    >
                      <option value="">— 選択してください —</option>
                      {weaponNameOptions.map((option) => <option key={option.name} value={option.name}>{option.name}</option>)}
                    </select>
                }
              </div>
            )}
          </div>
        </div>

        {/* 武器スキル一括表示 */}
        <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10 backdrop-blur-sm shadow-inner overflow-hidden">
          <h3 className="text-center mb-3 text-sm sm:text-base font-bold text-orange-300 uppercase tracking-widest italic">武器固有スキル</h3>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-hide">
            {weaponSkills.length === 0 && <p className="text-center text-xs text-zinc-600 col-span-full py-10 italic">スキルなし</p>}
            {weaponSkills.map((skill) => (
              <div key={skill.id} className="flex flex-col items-center bg-zinc-800/40 p-2 rounded-lg border border-white/5 shadow-sm hover:bg-zinc-700/50 transition-colors">
                <label htmlFor={`weapon-skill-${skill.id}`} className="mb-1 font-bold text-[10px] text-orange-200/50 text-center line-clamp-1 h-4 w-full px-0.5">
                  {skill.name}
                </label>
                <div className="relative w-full">
                  <select
                    id={`weapon-skill-${skill.id}`}
                    value={selectedWeaponLevels[skill.id] ?? 0}
                    onChange={(e) => onWeaponLevelChange(skill.id, Number(e.target.value))}
                    className="w-full h-7 text-[10px] border border-white/5 rounded-md bg-zinc-900/80 text-white outline-none text-center appearance-none cursor-pointer focus:ring-1 focus:ring-orange-500/50"
                  >
                    {[...Array((skill.maxLevel ?? 0) + 1).keys()].map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  <div className="absolute right-1 text-zinc-500 top-1/2 -translate-y-1/2 pointer-events-none text-[7px] opacity-30">▼</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* スマートな固定フッター */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-zinc-950/70 backdrop-blur-xl border-t border-white/10 shadow-[0_-15px_40px_rgba(0,0,0,0.4)]">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

          {/* 現在の選択サマリー */}
          <div className="flex-1 w-full overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500 text-white px-2 py-0.5 rounded shadow-[0_0_10px_rgba(59,130,246,0.5)]">Build Status</span>
              <span className="text-xs font-bold text-zinc-300">
                {allActiveSkills.length > 0 ? `Selected Skills: ${allActiveSkills.length}` : "No Skills Selected"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[44px] overflow-y-auto scrollbar-hide py-0.5">
              {allActiveSkills.length === 0 && (
                <span className="text-[10px] text-zinc-600 italic">Select skill levels from the list above to build your set...</span>
              )}
              {allActiveSkills.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-zinc-800/80 border border-white/5 px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap animate-in fade-in zoom-in duration-200">
                  <span className="text-[10px] font-bold text-zinc-200">{s.name}</span>
                  <span className="text-[11px] font-black text-blue-400">Lv.{s.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 操作ボタン */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={onResetClick}
              className="px-6 py-2.5 text-xs font-bold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-zinc-800 hover:border-red-500/20 shadow-sm"
            >
              RESET
            </button>
            <button
              onClick={onSearchClick}
              disabled={allActiveSkills.length === 0}
              className={`px-10 py-3 text-sm font-black text-white rounded-xl shadow-[0_10px_20px_-5px_rgba(59,130,246,0.4)] transition-all active:scale-95 ${allActiveSkills.length > 0
                ? "bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 border border-white/10"
                : "bg-zinc-800 border border-zinc-700 cursor-not-allowed opacity-30 grayscale"
                }`}
            >
              EQUIPMENT SEARCH 🚀
            </button>
          </div>
        </div>
      </div>

      {/* 検索結果表示 */}
      {showSearchResults && (
        <div className="mt-8 w-full max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-white uppercase tracking-wider">
            <span className="w-1.5 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"></span>
            Search Results
          </h2>
          <CombinationSearch
            selectedArmorSkills={searchParams.armorSkills}
            weaponType={searchParams.weaponType ?? ""}
            weaponElement={searchParams.weaponElement ?? ""}
            selectedWeaponName={searchParams.selectedWeaponName ?? ""}
            selectedWeaponSkills={searchParams.weaponSkills}
          />
        </div>
      )}
    </div>
  );
}
