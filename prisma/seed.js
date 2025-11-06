import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Example game data
  const games = [
    {
      name: "Genshin Impact",
      platform: "Mobile",
      genre: "Action RPG",
      riskScore: 0.4,
    },
    {
      name: "PUBG Mobile",
      platform: "Mobile",
      genre: "Battle Royale",
      riskScore: 0.7,
    },
    { name: "Fortnite", platform: "PC", genre: "Shooter", riskScore: 0.6 },
    { name: "Minecraft", platform: "PC", genre: "Sandbox", riskScore: 0.2 },
    { name: "Roblox", platform: "PC", genre: "Social", riskScore: 0.3 },
  ];

  console.log("🌱 Seeding games...");
  for (const game of games) {
    await prisma.game.upsert({
      where: { name: game.name },
      update: {},
      create: game,
    });
  }

  console.log("✅ Game seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
