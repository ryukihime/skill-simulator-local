
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching weapons...');
  const weapons = await prisma.weapon.findMany();
  console.log(`Found ${weapons.length} weapons.`);

  const outputPath = path.join(__dirname, '../src/data/Weapon.json');
  const dataDir = path.dirname(outputPath);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(weapons, null, 2));
  console.log(`Wrote weapons to ${outputPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
