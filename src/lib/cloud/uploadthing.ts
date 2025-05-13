// src/lib/cloud/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { z } from "zod";

const f = createUploadthing();

// Define validation schemas for metadata
const assetMetadataSchema = z.object({
  projectId: z.string().optional(),
  assetType: z.string().optional(),
});

export const ourFileRouter = {
  // Asset uploader with comprehensive file type support
  assetUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    audio: { maxFileSize: "16MB", maxFileCount: 1 },
    video: { maxFileSize: "64MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
    blob: { maxFileSize: "32MB", maxFileCount: 1 },
  })
    .middleware(async ({ req, input }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        throw new Error("Unauthorized");
      }
      
      // Validate and parse additional metadata if provided
      const metadata = assetMetadataSchema.parse(input || {});
      
      return { 
        userId: session.user.id,
        ...metadata,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Asset upload complete:", {
        userId: metadata.userId,
        fileUrl: file.ufsUrl,
        fileKey: file.key,
        fileType: file.type,
        fileName: file.name,
      });
      
      return { 
        uploadedBy: metadata.userId,
        fileUrl: file.ufsUrl,
        fileKey: file.key,
        fileName: file.name,
        fileType: file.type,
      };
    }),
    
  // Profile image uploader
  profileImage: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 1 } 
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        throw new Error("Unauthorized");
      }
      
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Profile image upload complete:", {
        userId: metadata.userId,
        fileUrl: file.ufsUrl,
      });
      
      return { 
        uploadedBy: metadata.userId,
        fileUrl: file.ufsUrl,
        fileKey: file.key,
      };
    }),
    
  // Project image uploader (for thumbnails and banners)
  projectImage: f({ 
    image: { maxFileSize: "8MB", maxFileCount: 1 } 
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        throw new Error("Unauthorized");
      }
      
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Project image upload complete:", {
        userId: metadata.userId,
        fileUrl: file.ufsUrl,
      });
      
      return { 
        uploadedBy: metadata.userId,
        fileUrl: file.ufsUrl,
        fileKey: file.key,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;