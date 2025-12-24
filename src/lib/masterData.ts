
import equipmentJson from '../data/Equipment.json';
import skillJson from '../data/skill.json';
import weaponSkillJson from '../data/weaponSkill.json';
import weaponJson from '../data/Weapon.json';

export type SkillItem = { name: string; level: number };

export type Equipment = {
    id: number;
    part: string;
    name: string;
    defense: number;
    slot1: number;
    slot2: number;
    slot3: number;
    series: string;
    group: string;
    skills: SkillItem[];
};

export type Skill = {
    id: number;
    name: string;
    level: number;
    category?: string;
    furigana?: string | null;
};

export type WeaponSkill = {
    id: number;
    name: string;
    maxLevel: number;
    furigana?: string | null;
};

export type Weapon = {
    id: number;
    name: string;
    type: string;
    attack: number;
    affinity: number; // 会心率
    element: string; // 属性名
    elementAtk: number;    // 属性攻撃力
    slot1: number;
    slot2: number;
    slot3: number;
    skills: SkillItem[];   // JSON dump might have this as string or object depending on how it was saved.
    furigana?: string | null;
};

// Add IDs if missing
export const EQUIPMENT_DATA: Equipment[] = (equipmentJson as any[]).map((item, index) => ({
    ...item,
    id: index + 1,
    skills: Array.isArray(item.skills) ? item.skills : [], // Ensure it's an array
}));

export const SKILL_DATA: Skill[] = (skillJson as any[]).map((item, index) => ({
    ...item,
    id: index + 1,
}));

export const WEAPON_SKILL_DATA: WeaponSkill[] = (weaponSkillJson as any[]).map((item, index) => ({
    ...item,
    id: index + 1,
    furigana: item.furigana || null,
}));

// Weapon JSON dumped from Prisma usually has IDs and correct types, but 'skills' might be a JSON field.
// Need to parse 'skills' if it's a string, though Prisma typed it as Json? in schema.
// Verification needed: Weapon.json is empty [] so safe for now.
export const WEAPON_DATA: Weapon[] = (weaponJson as any[]).map((item) => ({
    ...item,
    skills: typeof item.skills === 'string' ? JSON.parse(item.skills) : (item.skills || []),
}));
