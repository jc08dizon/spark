import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const statuses = [
  { name: "Open", slug: "open", color: "#47C7F4", sortOrder: 1, isClosed: false },
  { name: "In Progress", slug: "in-progress", color: "#005671", sortOrder: 2, isClosed: false },
  { name: "Waiting on Reporter", slug: "waiting-on-reporter", color: "#B3E3F3", sortOrder: 3, isClosed: false },
  { name: "Resolved", slug: "resolved", color: "#73CBE9", sortOrder: 4, isClosed: false },
  { name: "Closed", slug: "closed", color: "#AAAAAA", sortOrder: 5, isClosed: true },
  { name: "Cancelled", slug: "cancelled", color: "#DADADA", sortOrder: 6, isClosed: true },
];

async function main() {
  for (const status of statuses) {
    await prisma.ticketStatus.upsert({
      where: { slug: status.slug },
      update: status,
      create: status,
    });
  }

  await prisma.project.upsert({
    where: { key: "ITSD" },
    update: {},
    create: {
      key: "ITSD",
      name: "IT Service Desk",
      description: "Default project for employee-submitted tickets.",
      isActive: true,
      nextTicketNumber: 1,
    },
  });

  const department = await prisma.department.upsert({
    where: { name: "Information Technology" },
    update: {},
    create: { name: "Information Technology" },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "officer@ciit.edu" },
    update: {},
    create: {
      name: "Sample IT Officer",
      email: "officer@ciit.edu",
      password: passwordHash,
      role: "IT_OFFICER",
      departmentId: department.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "employee@ciit.edu" },
    update: {},
    create: {
      name: "Sample Employee",
      email: "employee@ciit.edu",
      password: passwordHash,
      role: "EMPLOYEE",
      departmentId: department.id,
    },
  });

  // Sample tickets so both roles have something to look at in dev. Seeded
  // with explicit ticketNumbers, so only run when the project has none —
  // real creation goes through createTicketWithKey's locked transaction.
  const ticketCount = await prisma.ticket.count();
  if (ticketCount === 0) {
    const project = await prisma.project.findUniqueOrThrow({ where: { key: "ITSD" } });
    const officer = await prisma.user.findUniqueOrThrow({ where: { email: "officer@ciit.edu" } });
    const employee = await prisma.user.findUniqueOrThrow({ where: { email: "employee@ciit.edu" } });
    const statusBySlug = async (slug: string) =>
      (await prisma.ticketStatus.findUniqueOrThrow({ where: { slug } })).id;

    const sampleTickets = [
      {
        ticketNumber: 1,
        title: "Projector in Room 204 not working",
        description:
          "The projector in Room 204 shows no signal even after swapping HDMI cables. Class starts at 1 PM.",
        type: "INCIDENT" as const,
        priority: "HIGH" as const,
        reporterId: employee.id,
        assigneeId: null,
        statusId: await statusBySlug("open"),
        category: null,
      },
      {
        ticketNumber: 2,
        title: "Install Adobe Premiere on MMA lab PCs",
        description:
          "Requesting installation of Adobe Premiere Pro on all 24 units in the MMA lab for next term's editing classes.",
        type: "SERVICE_REQUEST" as const,
        priority: "MEDIUM" as const,
        reporterId: employee.id,
        assigneeId: officer.id,
        statusId: await statusBySlug("in-progress"),
        category: "SOFTWARE" as const,
      },
      {
        ticketNumber: 3,
        title: "Wi-Fi keeps dropping in the faculty lounge",
        description:
          "Multiple faculty members report intermittent Wi-Fi disconnects in the lounge since Monday.",
        type: "INCIDENT" as const,
        priority: "URGENT" as const,
        reporterId: officer.id,
        assigneeId: officer.id,
        statusId: await statusBySlug("resolved"),
        category: "NETWORK" as const,
      },
      {
        ticketNumber: 4,
        title: "How do I access the new grading portal?",
        description:
          "I received the announcement about the new grading portal but the link asks for credentials I don't have.",
        type: "QUESTION" as const,
        priority: "LOW" as const,
        reporterId: officer.id,
        assigneeId: null,
        statusId: await statusBySlug("open"),
        category: "ACCOUNT_ACCESS" as const,
      },
    ];

    for (const t of sampleTickets) {
      await prisma.ticket.create({
        data: { ...t, projectId: project.id, departmentId: department.id },
      });
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { nextTicketNumber: sampleTickets.length + 1 },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
