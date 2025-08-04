-- AlterTable
ALTER TABLE "User" ADD COLUMN     "primaryContactId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_primaryContactId_fkey" FOREIGN KEY ("primaryContactId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
