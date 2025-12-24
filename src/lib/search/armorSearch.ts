
import { EQUIPMENT_DATA, Equipment, SkillItem } from '../masterData';

function parseSkillsField(skillsField: unknown): SkillItem[] {
    if (Array.isArray(skillsField)) return skillsField as SkillItem[];
    return [];
}

function groupByPart(equipments: Equipment[]): Record<string, Equipment[]> {
    const grouped: Record<string, Equipment[]> = {};
    for (const eq of equipments) {
        if (!grouped[eq.part]) grouped[eq.part] = [];
        grouped[eq.part].push(eq);
    }
    return grouped;
}

export function searchArmorCombinations(armorSkills: SkillItem[]): Equipment[][] {
    if (!armorSkills.length) return [];

    // Filter equipments that have at least one of the required skills
    const filtered = EQUIPMENT_DATA.filter((equip) => {
        const equipSkills = equip.skills;
        return armorSkills.some(selSkill =>
            equipSkills.some(es => es.name === selSkill.name)
        );
    });

    const grouped = groupByPart(filtered);
    const candidateGroups = Object.values(grouped);

    let armorResults: Equipment[][] = [];
    const skillsSorted = [...armorSkills].sort((a, b) => b.level - a.level);

    if (skillsSorted.length > 0) {
        const mainSkill = skillsSorted[0];


        // If mainGroups is empty or any group is empty? No, mainGroups logic in original code seems 
        // to filter groups based on main skill, but wait. 
        // Original logic: map ALL candidateGroups. If a group has NO items with main skill, it becomes empty list?
        // Let's look closer at original: `candidateGroups.map` ...
        // Actually the original logic seemed to rely on `candidateGroups` being derived from `filtered`, 
        // so every group in `candidateGroups` corresponds to a part (Head, Body...) that HAS relevant items.

        // SupplementDFS logic
        function supplementDfs(
            fullSet: Equipment[],
            partsUsed: Set<string>,
            skillShortage: Map<string, number>,
            vacantParts: string[]
        ) {
            if (vacantParts.length === 0) {
                if (Array.from(skillShortage.values()).every(lv => lv <= 0)) {
                    armorResults.push([...fullSet]);
                }
                return;
            }
            const part = vacantParts[0];
            const restParts = vacantParts.slice(1);

            // Find the group for this part
            // Original code: `const partIndex = Object.keys(grouped).indexOf(part);`
            // But `candidateGroups` is `Object.values(grouped)`. Order matters.
            // Better to look up in `grouped` directly.
            const groupForPart = grouped[part];

            if (!groupForPart) {
                // Should not happen if vacantParts came from keys of grouped, but safeguard
                supplementDfs(fullSet, partsUsed, skillShortage, restParts);
                return;
            }

            // Case: Don't equip this part (Original: `supplementDfs(..., restParts)`)
            // Wait, original code logic:
            // `const partIndex = Object.keys(grouped).indexOf(part);`
            // `supplementDfs(fullSet, partsUsed, skillShortage, restParts);` (Skip equipping)
            // `for (const armor of candidateGroups[partIndex]) ...`

            // Since we are iterating all combinations, skipping a part is valid if we can still meet requirements?
            // Or maybe skipping is trying to find minimal set?
            // Let's stick to original logic: Try skipping first.
            supplementDfs(fullSet, partsUsed, skillShortage, restParts);

            // Try equipping items from this part
            for (const armor of groupForPart) {
                let newShortage = new Map(skillShortage);
                for (const s of armor.skills) {
                    if (newShortage.has(s.name)) {
                        newShortage.set(s.name, newShortage.get(s.name)! - s.level);
                    }
                }
                supplementDfs([...fullSet, armor], new Set(partsUsed).add(armor.part), newShortage, restParts);
            }
        }

        // Main DFS
        // Original logic seemed to try to optimize by starting with `mainSkill` items.
        // If we faithfully copy:
        // `mainGroups` was derived from `candidateGroups`.
        // Wait, original `dfs(index, path)` iterates `mainGroups`.
        // BUT `mainGroups` has length equal to `candidateGroups`.
        // A specific group in `mainGroups` might be empty if that part has no item with `mainSkill >= required`.

        // Let's act simple: The original Python-like logic in TypeScript was trying to prune search space.
        // I will verify the original logic structure again.
        /*
          dfs(index):
           if index == mainGroups.length:
             calc shortage
             supplementDfs(...)
             return
    
           dfs(index + 1, path) // Skip this part group? 
           // In original: `dfs(index + 1, path)` was called before loop.
           
           for armor in mainGroups[index]:
             path.push(armor)
             dfs(index+1, path)
             path.pop()
        */

        // Original `mainGroups` is: `candidateGroups` filtered by items that have Main Skill.
        // So it only iterates armors that contribute to the main skill?
        // And then `supplementDfs` fills in the rest from `candidateGroups` (via `grouped` lookup).
        // Yes, this is a "Core + Supplement" strategy.

        // We need to preserve `candidateGroups` order for index consistency if we use index.
        const partKeys = Object.keys(grouped); // ["head", "body", ...]
        const mainGroups = partKeys.map(part =>
            grouped[part].filter(eq =>
                eq.skills.some(s => s.name === mainSkill.name && s.level >= mainSkill.level)
            )
        );

        function dfs(index: number, path: Equipment[]) {
            if (index === mainGroups.length) {
                // Calculate shortage
                const skillShortage = new Map<string, number>();
                for (const s of skillsSorted) {
                    const total = path.reduce((acc, armor) => {
                        const found = armor.skills.find(sk => sk.name === s.name);
                        return acc + (found ? found.level : 0);
                    }, 0);
                    skillShortage.set(s.name, Math.max(0, s.level - total));
                }

                const partsUsed = new Set(path.map(a => a.part));
                // vacantParts are parts that exist in 'grouped' (i.e. have candidates) but not used in 'path'
                const vacantParts = partKeys.filter(p => !partsUsed.has(p));

                supplementDfs(path, partsUsed, skillShortage, vacantParts);
                return;
            }

            // Option 1: Skip this part group in the 'Core' phase
            dfs(index + 1, path);

            // Option 2: Pick an armor from this part (if it contributes to main skill)
            for (const armor of mainGroups[index]) {
                path.push(armor);
                dfs(index + 1, path);
                path.pop();
            }
        }

        dfs(0, []);

    } else {
        return [];
    }

    return armorResults;
}
