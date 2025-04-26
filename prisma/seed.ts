import { PrismaClient, AssetType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // 1. Create users
  const users = [
    {
      id: 'user-1',
      name: 'PixelQueen',
      username: 'pixelqueen',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      bio: 'Pixel artist specializing in environment art and tilesets',
    },
    {
      id: 'user-2',
      name: 'GameArtPro',
      username: 'gameartpro',
      image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
      bio: 'Professional game artist with 10+ years experience in character design',
    },
    {
      id: 'user-3',
      name: 'RetroDevs',
      username: 'retrodevs',
      image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d',
      bio: 'Creating authentic retro game assets inspired by the 8-bit and 16-bit eras',
    },
    {
      id: 'user-4',
      name: 'GalacticModeler',
      username: 'galacticmodeler',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
      bio: 'Sci-fi 3D models and environments for space-themed games',
    },
    {
      id: 'user-5',
      name: 'SoundScaper',
      username: 'soundscaper',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      bio: 'Sound designer and foley artist creating immersive game audio',
    },
    {
      id: 'user-6',
      name: 'GameComposer',
      username: 'gamecomposer',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36',
      bio: 'Composer specializing in orchestral and chiptune game soundtracks',
    },
    {
      id: 'user-7',
      name: 'DungeonMaster',
      username: 'dungeonmaster',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      bio: 'Master of modular dungeon design',
    },
    {
      id: 'user-8',
      name: 'PixelStorm',
      username: 'pixelstorm',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde',
      bio: 'Pixel art animator focusing on weather and effects',
    },
  ];

  await prisma.user.createMany({ data: users, skipDuplicates: true });

  // 2. Create projects
  const projects = await Promise.all(
    users.map(async (user, index) => {
      // Only some users have projects
      if (index % 2 === 0) {
        return prisma.project.create({
          data: {
            title: `${user.name}'s Portfolio`,
            description: `A showcase of ${user.name}'s best works.`,
            userId: user.id,
            isPublic: true,
          },
        });
      }
      return null;
    })
  );

  // 3. Create assets
  const assets = [
    {
      id: '1',
      title: 'Forest Tileset',
      description: 'A complete tileset for forest environments with 64x64 pixel art tiles.',
      fileUrl: 'https://images.unsplash.com/photo-1561735746-003319594ef0',
      fileType: AssetType.IMAGE,
      userId: 'user-1',
      isPublic: true,
      tags: ['forest', 'tileset', 'pixel-art', '2d', 'environment'],
      createdAt: new Date('2023-10-15'),
      updatedAt: new Date('2023-10-16'),
    },
    {
      id: '2',
      title: 'Character Sprite Sheet',
      description: 'Main hero character with walking, running, and attack animations.',
      fileUrl: 'https://images.unsplash.com/photo-1633467067804-c08b17fd2a8a',
      fileType: AssetType.IMAGE,
      userId: 'user-2',
      isPublic: true,
      tags: ['character', 'sprite-sheet', 'pixel-art', 'animation', 'hero'],
      createdAt: new Date('2023-10-12'),
      updatedAt: new Date('2023-10-13'),
    },
    {
      id: '3',
      title: '8-Bit UI Elements',
      description: 'Comprehensive UI kit with buttons, panels, and icons in retro 8-bit style.',
      fileUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9',
      fileType: AssetType.IMAGE,
      userId: 'user-3',
      isPublic: true,
      tags: ['ui', '8-bit', 'retro', 'interface', 'buttons'],
      createdAt: new Date('2023-10-20'),
      updatedAt: new Date('2023-10-21'),
    },
    {
      id: '4',
      title: 'Spaceship 3D Model',
      description: 'Low-poly spaceship model perfect for space shooters or exploration games.',
      fileUrl: 'https://images.unsplash.com/photo-1581822261290-991b38693d1b',
      fileType: AssetType.MODEL_3D,
      userId: 'user-4',
      isPublic: true,
      tags: ['3d', 'spaceship', 'low-poly', 'sci-fi', 'model'],
      createdAt: new Date('2023-10-18'),
      updatedAt: new Date('2023-10-19'),
    },
    {
      id: '5',
      title: 'Dungeon Sound Effects',
      description: 'Pack of 20 atmospheric sound effects for dungeon levels.',
      fileUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
      fileType: AssetType.AUDIO,
      userId: 'user-5',
      isPublic: true,
      tags: ['audio', 'sound-effects', 'dungeon', 'atmosphere', 'fantasy'],
      createdAt: new Date('2023-10-23'),
      updatedAt: new Date('2023-10-24'),
    },
    {
      id: '6',
      title: 'Boss Battle Theme',
      description: 'Epic orchestral boss battle music track for your game\'s climactic moments.',
      fileUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d',
      fileType: AssetType.AUDIO,
      userId: 'user-6',
      isPublic: true,
      tags: ['audio', 'music', 'boss-battle', 'orchestral', 'epic'],
      createdAt: new Date('2023-10-10'),
      updatedAt: new Date('2023-10-11'),
    },
    {
      id: '7',
      title: 'Modular Dungeon Kit',
      description: 'Complete set of modular dungeon pieces for building diverse game levels.',
      fileUrl: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d',
      fileType: AssetType.IMAGE,
      userId: 'user-7',
      isPublic: true,
      tags: ['dungeon', 'modular', 'tileset', 'level-design', '3d'],
      createdAt: new Date('2023-10-05'),
      updatedAt: new Date('2023-10-06'),
    },
    {
      id: '8',
      title: 'Pixel Weather Effects',
      description: 'Collection of rain, snow, fog and other weather effects in pixel art style.',
      fileUrl: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d',
      fileType: AssetType.IMAGE,
      userId: 'user-8',
      isPublic: true,
      tags: ['weather', 'effects', 'pixel-art', 'animation', 'particles'],
      createdAt: new Date('2023-10-14'),
      updatedAt: new Date('2023-10-15'),
    },
  ];

  await prisma.asset.createMany({ data: assets, skipDuplicates: true });

  // 4. Random follows
  for (const user of users) {
    const followCount = faker.number.int({ min: 2, max: 5 });
    const followTargets = faker.helpers.shuffle(users.filter((u) => u.id !== user.id)).slice(0, followCount);

    for (const target of followTargets) {
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId: target.id,
        },
      });
    }
  }

  // 5. Random likes
  const allAssets = await prisma.asset.findMany();
  for (const asset of allAssets) {
    const likeCount = faker.number.int({ min: 3, max: 5 });
    const likers = faker.helpers.shuffle(users).slice(0, likeCount);

    for (const liker of likers) {
      await prisma.like.create({
        data: {
          userId: liker.id,
          assetId: asset.id,
        },
      });
    }
  }

  // 6. Random comments
  for (const asset of allAssets) {
    const commentCount = faker.number.int({ min: 2, max: 5 });
    for (let i = 0; i < commentCount; i++) {
      await prisma.comment.create({
        data: {
          content: faker.lorem.sentence(),
          userId: users[faker.number.int({ min: 0, max: users.length - 1 })].id,
          assetId: asset.id,
        },
      });
    }
  }

  // 7. Create chats and messages
  const chat = await prisma.chat.create({ data: {} });

  for (const user of users.slice(0, 4)) {
    await prisma.userChat.create({
      data: {
        userId: user.id,
        chatId: chat.id,
      },
    });

    await prisma.message.create({
      data: {
        content: faker.lorem.sentence(),
        chatId: chat.id,
        senderId: user.id,
        receiverId: users[0].id,
      },
    });
  }

  // 8. Create notifications
  for (const user of users) {
    await prisma.notification.create({
      data: {
        type: 'FOLLOW',
        content: `${user.name} followed you!`,
        receiverId: users[0].id,
        senderId: user.id,
      },
    });
  }

  // 9. Dummy subscriptions
  for (const user of users.slice(0, 3)) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
      },
    });
  }

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
