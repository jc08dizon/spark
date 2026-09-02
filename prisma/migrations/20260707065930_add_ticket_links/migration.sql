-- CreateEnum
CREATE TYPE "TicketLinkType" AS ENUM ('DUPLICATES', 'RELATES_TO', 'BLOCKS');

-- CreateTable
CREATE TABLE "TicketLink" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "linkType" "TicketLinkType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketLink_sourceId_targetId_linkType_key" ON "TicketLink"("sourceId", "targetId", "linkType");

-- AddForeignKey
ALTER TABLE "TicketLink" ADD CONSTRAINT "TicketLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketLink" ADD CONSTRAINT "TicketLink_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
