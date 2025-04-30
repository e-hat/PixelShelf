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

  console.log('Creating chats and messages...');

  // Create chats between user-1 and other users
  for (let i = 1; i < 4; i++) {
    const chat = await prisma.chat.create({ data: {} });
    
    // Add users to the chat
    await prisma.userChat.create({
      data: {
        userId: 'user-1',
        chatId: chat.id,
      },
    });
    
    await prisma.userChat.create({
      data: {
        userId: `user-${i + 1}`,
        chatId: chat.id,
        hasUnread: i === 3, // Make the last chat unread
      },
    });
    
    // Add messages to each chat
    const messageCount = faker.number.int({ min: 3, max: 8 });
    for (let j = 0; j < messageCount; j++) {
      // Alternate senders
      const senderId = j % 2 === 0 ? 'user-1' : `user-${i + 1}`;
      const receiverId = j % 2 === 0 ? `user-${i + 1}` : 'user-1';
      
      // Generate message content based on the users
      let content;
      if (senderId === 'user-1') {
        content = faker.helpers.arrayElement([
          `Hey, I really like your ${faker.helpers.arrayElement(['pixel art', 'character design', '3D models', 'sound effects'])}!`,
          `Do you have any tips for creating ${faker.helpers.arrayElement(['pixel sprites', 'background music', 'game environments', 'character animations'])}?`,
          `I'm working on a ${faker.helpers.arrayElement(['platformer', 'RPG', 'puzzle game', 'strategy game'])} and could use some advice.`,
          `Would you be interested in collaborating on a game jam project?`,
          faker.lorem.sentence(),
        ]);
      } else {
        content = faker.helpers.arrayElement([
          `Thanks! I'm glad you like my work!`,
          `Sure, I'd be happy to share some tips about that.`,
          `I've been working on game dev for ${faker.number.int({ min: 1, max: 10 })} years now.`,
          `Let me know if you need any specific assets for your project.`,
          faker.lorem.sentence(),
        ]);
      }
      
      // For the last chat, mark some messages as unread
      const read = !(i === 3 && j >= messageCount - 2 && senderId !== 'user-1');
      
      await prisma.message.create({
        data: {
          content,
          chatId: chat.id,
          senderId,
          receiverId,
          read,
          createdAt: new Date(Date.now() - (messageCount - j) * 1000 * 60 * 60), // Stagger times
        },
      });
    }
  }

  console.log('Creating additional assets for explore page...');

  // Create more assets with different types and tags for better explore page testing
  const additionalAssets = [
    // 3D Models
    {
      title: '3D Fantasy Character Pack',
      description: 'Collection of low-poly fantasy character models including warriors, mages, and rogues.',
      fileUrl: 'https://images.unsplash.com/photo-1639762681057-408e52192e55',
      fileType: AssetType.MODEL_3D,
      userId: 'user-4',
      isPublic: true,
      tags: ['3d', 'character', 'fantasy', 'low-poly', 'pack'],
    },
    {
      title: 'Sci-Fi Weapon Collection',
      description: 'Set of 10 detailed sci-fi weapons including lasers, plasma rifles and futuristic melee weapons.',
      fileUrl: 'https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7',
      fileType: AssetType.MODEL_3D,
      userId: 'user-4',
      isPublic: true,
      tags: ['3d', 'weapon', 'sci-fi', 'gun', 'collection'],
    },
    
    // Audio
    {
      title: 'RPG Soundtrack Bundle',
      description: 'Complete soundtrack for RPG games including town, battle, dungeon, and overworld themes.',
      fileUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745',
      fileType: AssetType.AUDIO,
      userId: 'user-6',
      isPublic: true,
      tags: ['audio', 'music', 'soundtrack', 'rpg', 'bundle'],
    },
    {
      title: 'Combat Sound Effects',
      description: 'Over 50 high-quality combat sound effects including sword slashes, punches, magic spells and more.',
      fileUrl: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7',
      fileType: AssetType.AUDIO,
      userId: 'user-5',
      isPublic: true,
      tags: ['audio', 'sfx', 'combat', 'action', 'magic'],
    },
    
    // Video
    {
      title: 'Particle Effects VFX Pack',
      description: 'Pre-rendered particle effects for fire, water, electricity and magic spells.',
      fileUrl: 'https://images.unsplash.com/photo-1606676539940-12768ce0e762',
      fileType: AssetType.VIDEO,
      userId: 'user-3',
      isPublic: true,
      tags: ['video', 'vfx', 'particles', 'effects', 'magic'],
    },
    {
      title: 'Game Trailer Template',
      description: 'Customizable template for creating professional game trailers.',
      fileUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
      fileType: AssetType.VIDEO,
      userId: 'user-2',
      isPublic: true,
      tags: ['video', 'trailer', 'template', 'marketing'],
    },
    
    // Documents
    {
      title: 'Game Design Document Template',
      description: 'Comprehensive GDD template with sections for all aspects of game design.',
      fileUrl: 'https://images.unsplash.com/photo-1512758017271-d7b84c2113f1',
      fileType: AssetType.DOCUMENT,
      userId: 'user-7',
      isPublic: true,
      tags: ['document', 'template', 'game-design', 'gdd'],
    },
    {
      title: 'Level Design Guidelines',
      description: 'Professional guidelines for creating engaging and balanced game levels.',
      fileUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
      fileType: AssetType.DOCUMENT,
      userId: 'user-8',
      isPublic: true,
      tags: ['document', 'level-design', 'tutorial', 'guide'],
    },
    
    // Additional pixel art assets
    {
      title: 'Platformer Tileset',
      description: 'Complete tileset for 2D platformer games with multiple themes.',
      fileUrl: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1',
      fileType: AssetType.IMAGE,
      userId: 'user-1',
      isPublic: true,
      tags: ['pixel-art', 'tileset', '2d', 'platformer'],
    },
    {
      title: 'Pixel Food Icons',
      description: 'Set of 50+ pixel art food icons for RPG and survival games.',
      fileUrl: 'https://images.unsplash.com/photo-1605106702734-205df224ecce',
      fileType: AssetType.IMAGE,
      userId: 'user-1',
      isPublic: true,
      tags: ['pixel-art', 'icons', 'food', 'rpg', 'ui'],
    },
  ];

  // Insert additional assets
  for (const asset of additionalAssets) {
    await prisma.asset.create({
      data: {
        ...asset,
        createdAt: new Date(Date.now() - faker.number.int({ min: 1, max: 30 }) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
    });
  }

  // Add some likes and comments to these assets for better trending data
  for (const asset of await prisma.asset.findMany()) {
    // Add between 0-5 likes per asset
    const likeCount = faker.number.int({ min: 0, max: 5 });
    const likers = faker.helpers.shuffle([...users]).slice(0, likeCount);
    
    for (const liker of likers) {
      try {
        await prisma.like.create({
          data: {
            userId: liker.id,
            assetId: asset.id,
          },
        });
      } catch (error) {
        // Ignore duplicate key errors
        console.log(`Like already exists for user ${liker.id} on asset ${asset.id}`);
      }
    }
    
    // Add between 0-3 comments per asset
    const commentCount = faker.number.int({ min: 0, max: 3 });
    for (let i = 0; i < commentCount; i++) {
      const commenter = users[faker.number.int({ min: 0, max: users.length - 1 })];
      
      await prisma.comment.create({
        data: {
          content: faker.helpers.arrayElement([
            'This looks amazing!',
            'Great work on this asset!',
            'This will be perfect for my game project.',
            'I love the style, very well done!',
            'How long did this take you to create?',
            faker.lorem.sentence(),
          ]),
          userId: commenter.id,
          assetId: asset.id,
        },
      });
    }
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
