'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban, Clock, ImageIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    assetCount: number;
    createdAt: Date;
  };
  username: string;
}

export default function ProjectCard({ project, username }: ProjectCardProps) {
  return (
    <Link href={`/u/${username}/projects/${project.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-all group h-full flex flex-col">
        <div className="relative aspect-video w-full overflow-hidden">
          {project.thumbnail ? (
            <Image
              src={project.thumbnail}
              alt={project.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pixelshelf-light to-pixelshelf-primary flex items-center justify-center">
              <FolderKanban className="h-16 w-16 text-white" />
            </div>
          )}
        </div>
        <CardContent className="p-5 flex-grow flex flex-col">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-pixelshelf-primary">
            {project.title}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-grow">
            {project.description}
          </p>
          <div className="flex text-sm text-muted-foreground justify-between">
            <div className="flex items-center">
              <ImageIcon className="h-4 w-4 mr-1" />
              <span>{project.assetCount} assets</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatDate(project.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}