import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
 
const f = createUploadthing();
 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique route key
  assetUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    audio: { maxFileSize: "16MB", maxFileCount: 1 },
    video: { maxFileSize: "64MB", maxFileCount: 1 },
    pdf: { maxFileSize: "4MB", maxFileCount: 1 },
    blob: { maxFileSize: "32MB", maxFileCount: 1 },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on this server before upload
      const session = await getServerSession(authOptions);
 
      // If this throws, the user will not be able to upload
      if (!session || !session.user) throw new Error("Unauthorized");
 
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
 
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, fileUrl: file.url, fileKey: file.key };
    }),
    
  profileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, fileUrl: file.url, fileKey: file.key };
    }),
    
  projectImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 }, })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, fileUrl: file.url, fileKey: file.key };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;