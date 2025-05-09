import { PrismaClient } from '@prisma/client';

/**
 * @type {PrismaClient}
 */
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    /**
     * @type {PrismaClient}
     */
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}


export default prisma;


// import { PrismaPg } from '@prisma/adapter-pg'
// import { PrismaClient } from '@prisma/client'

// const connectionString = `${process.env.DATABASE_URL}`

// const adapter = new PrismaPg({ connectionString });

// /**
//  * @type {PrismaClient}
//  */
// const prisma = new PrismaClient({ adapter });

// prisma

// export default prisma