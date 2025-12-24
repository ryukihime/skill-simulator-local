
import { WEAPON_DATA, Weapon, SkillItem } from '../masterData';

export type WeaponSearchParams = {
    weaponType?: string;
    weaponElement?: string;
    weaponSkills?: SkillItem[];
};

function matchWeaponSkill(weaponSkills: SkillItem[], requirements: SkillItem[]) {
    return requirements.every(req =>
        weaponSkills.some(ws => ws.name === req.name && ws.level >= req.level)
    );
}

export function searchWeapons(params: WeaponSearchParams): Weapon[] {
    const { weaponType, weaponElement, weaponSkills = [] } = params;

    let weapons = WEAPON_DATA;

    if (weaponType) {
        weapons = weapons.filter(w => w.type === weaponType);
    }

    if (weaponElement) {
        weapons = weapons.filter(w => w.element === weaponElement);
    }

    if (weaponSkills.length > 0) {
        weapons = weapons.filter(w => {
            // w.skills is already SkillItem[] thanks to masterData parsing
            return matchWeaponSkill(w.skills, weaponSkills);
        });
    }

    return weapons;
}
