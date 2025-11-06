// THIS RESPONSIBLE FOR CONNECT PRISMA INSIDE MY CODE AFTER HAVE RUN 'npx prisma generate'

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
