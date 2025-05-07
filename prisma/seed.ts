import { PrismaClient, AssetType } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // 1a. Create 8 “base” users
  const baseUsers = Array.from({ length: 8 }).map((_, i) => ({
    id: `user-${i + 1}`,
    name: faker.person.firstName(),
    username: faker.internet.username().toLowerCase() + (i + 1),
    image: faker.image.avatar(),
    bio: faker.person.bio(),
  }));

  // 1b. Create 50 extra “creator” users
  const extraCount = 50;
  const extraUsers = Array.from({ length: extraCount }).map((_, i) => {
    const idx = baseUsers.length + i + 1;
    return {
      id: `user-${idx}`,
      name: faker.person.firstName(),
      username: faker.internet.username().toLowerCase() + idx,
      image: faker.image.avatar(),
      bio: faker.person.bio(),
    };
  });

  // combined users array
  const users = [...baseUsers, ...extraUsers];

  // insert all users at once
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  // 2. Create projects (every other user gets a “Portfolio” project)
  const projects = await Promise.all(
    users.map((user, i) =>
      i % 2 === 0
        ? prisma.project.create({
            data: {
              title: `${user.name}'s Portfolio`,
              description: `A showcase of ${user.name}'s best works.`,
              userId: user.id,
              isPublic: true,
            },
          })
        : null
    )
  );

  // 3. Create assets
  const assetTypes = [
    AssetType.IMAGE,
    AssetType.MODEL_3D,
    AssetType.AUDIO,
    AssetType.VIDEO,
    AssetType.DOCUMENT,
  ];
  const tagsPool = [
    'pixel-art', '3d', 'rpg', 'ui', 'dungeon', 'tileset',
    'sci-fi', 'audio', 'animation', 'sprite', 'magic',
    'level-design', 'environment', 'combat', 'template',
  ];

  const assets = Array.from({ length: 50 }).map(() => {
    const user = faker.helpers.arrayElement(users);
    const assetType = faker.helpers.arrayElement(assetTypes);
    return {
      title: faker.commerce.productName(),
      description: faker.lorem.sentence(),
      fileUrl: faker.image.url(),
      fileType: assetType,
      userId: user.id,
      isPublic: true,
      tags: faker.helpers.arrayElements(tagsPool, 4),
      createdAt: faker.date.recent({ days: 30 }),
      updatedAt: new Date(),
    };
  });

  for (const asset of assets) {
    await prisma.asset.create({ data: asset });
  }

  const allAssets = await prisma.asset.findMany();

  // 4. Random follows
  for (const user of users) {
    const followTargets = faker.helpers
      .shuffle(users.filter((u) => u.id !== user.id))
      .slice(0, faker.number.int({ min: 2, max: 4 }));

    for (const target of followTargets) {
      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: target.id,
          },
        },
        update: {},
        create: {
          followerId: user.id,
          followingId: target.id,
        },
      });
    }
  }

  // 5. Likes
  for (const asset of allAssets) {
    const likers = faker.helpers.shuffle(users).slice(0, 5);
    for (const liker of likers) {
      try {
        await prisma.like.create({
          data: {
            userId: liker.id,
            assetId: asset.id,
          },
        });
      } catch {}
    }
  }

  // 6. Comments
  for (const asset of allAssets) {
    const count = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < count; i++) {
      const commenter = faker.helpers.arrayElement(users);
      await prisma.comment.create({
        data: {
          content: faker.lorem.sentence(),
          userId: commenter.id,
          assetId: asset.id,
        },
      });
    }
  }

  // 7. Chats
  const chat = await prisma.chat.create({ data: {} });
  for (const user of users.slice(0, 4)) {
    await prisma.userChat.create({
      data: { userId: user.id, chatId: chat.id },
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

  // 8. Notifications
  for (const user of users) {
    try {
      await prisma.notification.create({
        data: {
          type: 'FOLLOW',
          content: `${user.name} followed you!`,
          receiverId: users[0].id,
          senderId: user.id,
        },
      });
    } catch {}
  }

  // 9. Dummy subscriptions
  for (const user of users.slice(0, 3)) {
    try {
      await prisma.subscription.create({
        data: {
          userId: user.id,
        },
      });
    } catch {}
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
