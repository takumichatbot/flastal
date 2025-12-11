-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "progressHistory" JSONB[] DEFAULT ARRAY[]::JSONB[];
