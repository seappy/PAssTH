-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeStoreId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeStoreId_fkey" FOREIGN KEY ("activeStoreId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
