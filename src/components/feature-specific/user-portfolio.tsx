'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Share2, 
  Edit, 
  ExternalLink, 
  ArrowRight, 
  Globe, 
  Twitter, 
  Github, 
  Linkedin, 
  Folder as FolderIcon, 
  Link as LinkIcon, 
  MessageSquare as MessageIcon,
  Calendar,
  User,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/feature-specific/user-avatar';
import { SocialShare } from '@/components/feature-specific/social-share';
import { AssetGrid } from '@/components/shared/asset-grid';
import { api, ApiError } from '@/lib/api/api-client';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { User as UserType, Asset, Project } from '@/types';
import { cn } from '@/lib/utils';
import AssetCard from './asset-card';

interface UserPortfolioProps {
  username: string;
  isPremium?: boolean;
}

export function UserPortfolio({ username, isPremium = false }: UserPortfolioProps) {
  const { data: session } = useSession();
  const [user, setUser] = useState<UserType | null>(null);
  const [highlightedProjects, setHighlightedProjects] = useState<Project[]>([]);
  const [featuredAssets, setFeaturedAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('about');
  
  // Check if this is the current user's profile
  const isCurrentUser = session?.user?.username === username;
  
  // Flag for premium profile
  const showPremiumFeatures = isPremium || (isCurrentUser && session?.user?.subscriptionTier === 'PREMIUM');

  // Fetch user profile and portfolio data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user profile
        const userProfile = await api.users.getProfile(username);
        setUser(userProfile);
        
        // Fetch highlighted projects
        const projectsResponse = await api.projects.getAll({ 
          username, 
          limit: 3,
          sort: 'popular'
        });
        setHighlightedProjects(projectsResponse.projects);
        
        // Fetch featured assets
        const assetsResponse = await api.assets.getAll({
          username,
          limit: 6,
          sort: 'popular'
        });
        setFeaturedAssets(assetsResponse.assets);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
        setError(err instanceof ApiError ? err.message : 'Failed to load portfolio');
        toast.error('Failed to load portfolio');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (username) {
      fetchData();
    }
  }, [username]);

  // Handle section navigation
  const handleSectionClick = (section: string) => {
    setActiveSection(section);
    
    // Scroll to section
    const sectionElement = document.getElementById(`section-${section}`);
    if (sectionElement) {
      const yOffset = -80; // Header height + padding
      const y = sectionElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Portfolio upgrade CTA component
  const PremiumUpgradePrompt = () => (
    <div className="bg-gradient-to-br from-pixelshelf-light/50 to-pixelshelf-primary/10 border border-pixelshelf-primary/20 rounded-lg p-6 text-center my-12">
      <h3 className="text-xl font-bold mb-2">Upgrade to Premium</h3>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
        Unlock your professional portfolio page with advanced customization, analytics, and more.
      </p>
      <Link href="/settings/subscription">
        <Button variant="pixel">
          Upgrade Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <PortfolioSkeleton />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Error Loading Portfolio</h2>
        <p className="text-muted-foreground mb-6">{error || 'Failed to load user data'}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  // For non-premium users, show a different layout with upgrade prompt
  if (!showPremiumFeatures) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
            <UserAvatar user={{ name: user.name, image: user.image }} size="xl" className="mx-auto md:mx-0" />
            <div>
              <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">@{user.username}</p>
              {user.bio && <p className="mb-4">{user.bio}</p>}
              <div className="flex flex-wrap gap-4 mb-4">
                {user.social?.website && (
                  <a href={`https://${user.social.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <Globe className="h-4 w-4 mr-1" />
                    {user.social.website}
                  </a>
                )}
                {user.social?.twitter && (
                  <a href={`https://twitter.com/${user.social.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <Twitter className="h-4 w-4 mr-1" />
                    @{user.social.twitter}
                  </a>
                )}
                {user.social?.github && (
                  <a href={`https://github.com/${user.social.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <Github className="h-4 w-4 mr-1" />
                    {user.social.github}
                  </a>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Joined {formatDate(user.createdAt)}
              </div>
            </div>
          </div>
          
          {isCurrentUser && <PremiumUpgradePrompt />}
          
          <div className="my-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              Projects
              <Link href={`/u/${username}`} className="ml-auto text-base font-normal text-muted-foreground hover:text-foreground flex items-center">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {highlightedProjects.map(project => (
                <ProjectCard key={project.id} project={project} username={username} />
              ))}
            </div>
          </div>
          
          <div className="my-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              Featured Assets
              <Link href={`/u/${username}`} className="ml-auto text-base font-normal text-muted-foreground hover:text-foreground flex items-center">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </h2>
            {featuredAssets.length > 0 ? (
              <div className="grid-masonry">
                {featuredAssets.slice(0, 6).map(asset => (
                  <AssetCard key={asset.id} asset={asset} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">
                  No assets found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Premium portfolio layout
  return (
    <div className="bg-background min-h-screen pb-12">
      {/* Hero section with banner */}
      <div className="relative h-80 bg-gradient-to-br from-pixelshelf-light to-pixelshelf-primary overflow-hidden">
        {user.bannerImage && (
          <Image
            src={user.bannerImage}
            alt={`${user.name}'s banner`}
            fill
            className="object-cover"
            priority
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
        
        {/* Floating card with profile info */}
        <div className="container mx-auto px-4">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-background border shadow-lg rounded-xl p-6 w-full max-w-4xl flex flex-col md:flex-row items-center md:items-start gap-6">
            <UserAvatar user={{ name: user.name, image: user.image }} size="xl" showBadge isPremium={user.subscriptionTier === 'PREMIUM'} />
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">@{user.username}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                {user.social?.website && (
                  <a href={`https://${user.social.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <Globe className="h-4 w-4 mr-1" />
                    {user.social.website}
                  </a>
                )}
                {user.social?.twitter && (
                  <a href={`https://twitter.com/${user.social.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <Twitter className="h-4 w-4 mr-1" />
                    @{user.social.twitter}
                  </a>
                )}
                {user.social?.github && (
                  <a href={`https://github.com/${user.social.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                    <Github className="h-4 w-4 mr-1" />
                    {user.social.github}
                  </a>
                )}
              </div>
            </div>
            
            <div className="ml-auto flex space-x-2 self-end">
              {isCurrentUser ? (
                <Link href="/settings/profile">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <SocialShare
                  title={`${user.name}'s Portfolio`}
                  description={user.bio || `Check out ${user.name}'s game development portfolio`}
                  url={`https://pixelshelf.dev/portfolio/${user.username}`}
                  variant="button"
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="mt-32 sticky top-16 z-10 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <nav className="flex overflow-x-auto pb-px">
              <button
                onClick={() => handleSectionClick('about')}
                className={cn("px-4 py-2 font-medium text-sm whitespace-nowrap", 
                  activeSection === 'about'
                    ? "text-foreground border-b-2 border-pixelshelf-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                About
              </button>
              <button
                onClick={() => handleSectionClick('projects')}
                className={cn("px-4 py-2 font-medium text-sm whitespace-nowrap",
                  activeSection === 'projects'
                    ? "text-foreground border-b-2 border-pixelshelf-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Projects
              </button>
              <button
                onClick={() => handleSectionClick('gallery')}
                className={cn("px-4 py-2 font-medium text-sm whitespace-nowrap",
                  activeSection === 'gallery'
                    ? "text-foreground border-b-2 border-pixelshelf-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Gallery
              </button>
              {user.bio && (
                <button
                  onClick={() => handleSectionClick('devlog')}
                  className={cn("px-4 py-2 font-medium text-sm whitespace-nowrap",
                    activeSection === 'devlog'
                      ? "text-foreground border-b-2 border-pixelshelf-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Dev Log
                </button>
              )}
              <button
                onClick={() => handleSectionClick('contact')}
                className={cn("px-4 py-2 font-medium text-sm whitespace-nowrap",
                  activeSection === 'contact'
                    ? "text-foreground border-b-2 border-pixelshelf-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Contact
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Content sections */}
      <div className="container mx-auto px-4 pt-12">
        <div className="max-w-4xl mx-auto space-y-24">
          {/* About section */}
          <section id="section-about">
            <h2 className="text-3xl font-bold mb-6">About Me</h2>
            <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
              {user.bio ? (
                <p>{user.bio}</p>
              ) : (
                <p className="text-muted-foreground">
                  {user.name} hasn't added a bio yet.
                </p>
              )}
              {user.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 not-prose mt-8">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{user.stats.projects}</div>
                    <div className="text-sm text-muted-foreground">Projects</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{user.stats.assets}</div>
                    <div className="text-sm text-muted-foreground">Assets</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{user.stats.followers}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">{formatDate(user.createdAt)}</div>
                    <div className="text-sm text-muted-foreground">Joined</div>
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* Projects section */}
          <section id="section-projects">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              Highlighted Projects
              <Link href={`/u/${username}`} className="ml-auto text-base font-normal text-muted-foreground hover:text-foreground flex items-center">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </h2>
            {highlightedProjects.length > 0 ? (
              <div className="space-y-8">
                {highlightedProjects.map(project => (
                  <FeatureProjectCard key={project.id} project={project} username={username} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">
                  No projects found
                </p>
              </div>
            )}
          </section>
          
          {/* Gallery section */}
          <section id="section-gallery">
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              Asset Gallery
              <Link href={`/u/${username}`} className="ml-auto text-base font-normal text-muted-foreground hover:text-foreground flex items-center">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </h2>
            {featuredAssets.length > 0 ? (
              <AssetGrid 
                assets={featuredAssets}
                allowViewToggle={true}
                allowFiltering={false}
              />
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">
                  No assets found
                </p>
              </div>
            )}
          </section>
          
          {/* Dev Log section */}
          {user.bio && (
            <section id="section-devlog">
              <h2 className="text-3xl font-bold mb-6">Dev Log</h2>
              <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  {isCurrentUser ? (
                    <>
                      You haven't added any dev log entries yet. You can add them by editing your profile.
                      <div className="mt-4">
                        <Link href="/settings/profile">
                          <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>{user.name} hasn't added any dev log entries yet.</>
                  )}
                </p>
              </div>
            </section>
          )}
          
          {/* Contact section */}
          <section id="section-contact">
            <h2 className="text-3xl font-bold mb-6">Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Connect with {user.name}</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" className="w-full">
                      <MessageIcon className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                  <div className="flex flex-col space-y-3">
                    {user.social?.website && (
                      <a href={`https://${user.social.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <Globe className="h-4 w-4 mr-2" />
                        <span className="truncate">{user.social.website}</span>
                        <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                      </a>
                    )}
                    {user.social?.twitter && (
                      <a href={`https://twitter.com/${user.social.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <Twitter className="h-4 w-4 mr-2" />
                        <span>@{user.social.twitter}</span>
                        <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                      </a>
                    )}
                    {user.social?.github && (
                      <a href={`https://github.com/${user.social.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <Github className="h-4 w-4 mr-2" />
                        <span>{user.social.github}</span>
                        <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                      </a>
                    )}
                    {user.social?.linkedin && (
                      <a href={`https://linkedin.com/in/${user.social.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <Linkedin className="h-4 w-4 mr-2" />
                        <span>{user.social.linkedin}</span>
                        <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Share this Portfolio</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Share {user.name}'s portfolio with others
                </p>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://pixelshelf.dev/portfolio/${user.username}`);
                      toast.success('Link copied to clipboard');
                    }}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <SocialShare
                    title={`${user.name}'s Portfolio`}
                    description={user.bio || `Check out ${user.name}'s game development portfolio`}
                    url={`https://pixelshelf.dev/portfolio/${user.username}`}
                    variant="button"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton component for the portfolio
function PortfolioSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Hero section skeleton */}
      <div className="relative h-64 w-full bg-muted rounded-lg"></div>
      
      {/* Profile info skeleton */}
      <div className="flex flex-col md:flex-row -mt-24 md:-mt-16 mb-8">
        <div className="relative mb-4 md:mb-0 md:mr-6">
          <div className="h-32 w-32 md:h-48 md:w-48 rounded-full bg-muted"></div>
        </div>
        
        <div className="flex-1 pt-0 md:pt-8 space-y-4">
          <div className="h-8 w-3/4 md:w-1/2 bg-muted rounded"></div>
          <div className="h-4 w-1/2 md:w-1/3 bg-muted rounded"></div>
          <div className="h-24 w-full bg-muted rounded"></div>
          
          <div className="flex flex-wrap gap-3">
            <div className="h-6 w-32 bg-muted rounded"></div>
            <div className="h-6 w-40 bg-muted rounded"></div>
            <div className="h-6 w-36 bg-muted rounded"></div>
          </div>
        </div>
      </div>
      
      {/* Tabs skeleton */}
      <div className="border-b">
        <div className="flex space-x-4 pb-4">
          <div className="h-8 w-20 bg-muted rounded"></div>
          <div className="h-8 w-20 bg-muted rounded"></div>
          <div className="h-8 w-20 bg-muted rounded"></div>
          <div className="h-8 w-20 bg-muted rounded"></div>
        </div>
      </div>
      
      {/* Content sections skeleton */}
      <div className="space-y-16">
        {/* About section */}
        <div>
          <div className="h-8 w-40 bg-muted rounded mb-6"></div>
          <div className="h-24 w-full bg-muted rounded"></div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted"></div>
            ))}
          </div>
        </div>
        
        {/* Projects section */}
        <div>
          <div className="h-8 w-52 bg-muted rounded mb-6"></div>
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 w-full rounded-lg bg-muted"></div>
            ))}
          </div>
        </div>
        
        {/* Gallery section */}
        <div>
          <div className="h-8 w-36 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-video rounded-lg bg-muted"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Project card components
function FeatureProjectCard({ project, username }: { project: Project; username: string }) {
  return (
    <div className="border rounded-lg overflow-hidden flex flex-col md:flex-row">
      <div className="md:w-1/3 bg-muted relative aspect-video md:aspect-auto">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            className="object-cover"
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-pixelshelf-light to-pixelshelf-primary flex items-center justify-center">
            <FolderIcon className="h-16 w-16 text-white" />
          </div>
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold mb-2">{project.title}</h3>
        {project.description && (
          <p className="text-muted-foreground mb-4 line-clamp-3">{project.description}</p>
        )}
        <div className="mt-auto flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {project.assetCount} assets
          </div>
          <Link href={`/u/${username}/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              View Project
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, username }: { project: Project; username: string }) {
  return (
    <Link href={`/u/${username}/projects/${project.id}`} className="block">
      <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-video bg-muted relative">
          {project.thumbnail ? (
            <Image
              src={project.thumbnail}
              alt={project.title}
              fill
              className="object-cover"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFfwJnQMuRpQAAAABJRU5ErkJggg=="
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pixelshelf-light to-pixelshelf-primary flex items-center justify-center">
              <FolderIcon className="h-12 w-12 text-white" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1">{project.title}</h3>
          {project.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{project.description}</p>
          )}
          <div className="text-xs text-muted-foreground">
            {project.assetCount} assets
          </div>
        </div>
      </div>
    </Link>
  );
}